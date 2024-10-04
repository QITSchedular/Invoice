import React, { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import "./invoice.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const PdfToImages = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [extractedTexts, setExtractedTexts] = useState([]);
    const [selection, setSelection] = useState(null);
    const [extractedData, setExtractedData] = useState({});
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const isSelectingRef = useRef(false);
    const selectionStart = useRef({ x: 0, y: 0 });
    const pdfImageData = useRef(null);
    const [matchedData, setMatchedData] = useState({});
    const [selectedText, setSelectedText] = useState(null)
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [highlightCoords, setHighlightCoords] = useState([]);

    const data_model = {
        "Invoice No": "",
        "Date": "",
        "vendor_name": "",
        "GST NO": "",
        "PAN No": "",
        "StateCode": "",
        "Contact": "",
        "Vendor Contact": "",
        "E-mail": "",
        "Total Amount": "",
        "After Tax Amount": "",
        "Website": "",
        "place_of_supply": "",
        "CIN NO": "",
        "Currency": "",
        "Vehicle No": "",
        "Agent Code": "",
        "IRN No.": "",
        "Payment Terms": "",
        "Acknowledgement No.": "",
        "Transporter": "Name",
        "Transportation Mode": "",
        "Factory address": "",
        "Office address": "",
        "Vendor Address": "",
        "LR No": "",
        "LR Date": "",
        "Party P.O. Ref": "",
        "Purchase Order": "",
        "Purchase PO Date": "",
        "Declaration": "",
        "Destination": "",
        "Booking": "",
    };
    const handlePdfUpload = async (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileUrl = URL.createObjectURL(file);
            setPdfFile(fileUrl);
            await convertToImagesAndExtractText(fileUrl);
        }
    };

    const convertToImagesAndExtractText = async (fileUrl) => {
        try {
            const loadingTask = pdfjsLib.getDocument(fileUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            contextRef.current = context;
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;

            pdfImageData.current = context.getImageData(0, 0, canvas.width, canvas.height);
            const result = await Tesseract.recognize(fileUrl, 'eng', {
                logger: (m) => console.log(m),
            });
            const extractedText = result.data.text;
            console.log("Extracted Text:", extractedText);
            const extractedData = extractDataFromText(extractedText, data_model);
            setExtractedData(extractedData);

            const matchedData = matchData(extractedData, data_model);
            setMatchedData(matchedData);

        } catch (error) {
            console.error("Error loading PDF:", error);
        }
    };

    const matchData = (extractedData, dataModel) => {
        const matchedData = {};
        for (const key in dataModel) {
            if (extractedData[key]) {
                matchedData[key] = extractedData[key];
            } else {
                matchedData[key] = "No match found";
            }
        }

        console.log("Matched Data:", matchedData);
        return matchedData;
    };

    const handleMouseDown = (event) => {
        isSelectingRef.current = true;
        selectionStart.current = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    };

    const handleMouseMove = (event) => {
        if (!isSelectingRef.current) return;
        const { offsetX, offsetY } = event.nativeEvent;
        const startX = selectionStart.current.x;
        const startY = selectionStart.current.y;
        setSelection({
            x: Math.min(startX, offsetX),
            y: Math.min(startY, offsetY),
            width: Math.abs(startX - offsetX),
            height: Math.abs(startY - offsetY),
        });
        const context = contextRef.current;
        context.putImageData(pdfImageData.current, 0, 0);
        context.strokeStyle = "blue";
        context.lineWidth = 2;
        context.strokeRect(
            Math.min(startX, offsetX),
            Math.min(startY, offsetY),
            Math.abs(startX - offsetX),
            Math.abs(startY - offsetY)
        );
    };

    const handleMouseUp = async () => {
        if (!isSelectingRef.current) return;
        isSelectingRef.current = false;
        const context = contextRef.current;
        const { x, y, width, height } = selection;
        const selectedImageData = context.getImageData(x, y, width, height);
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext("2d").putImageData(selectedImageData, 0, 0);

        const selectedImageURL = tempCanvas.toDataURL("image/png");
        console.log(selectedImageURL);

        try {
            const result = await Tesseract.recognize(selectedImageURL, 'eng', {
                logger: (m) => console.log(m),
            });

            const extractedText = result.data.text;
            setSelectedText(extractedText)
            console.log("Selected Text:", extractedText);
            const matchedKey = Object.keys(data_model).find(key => extractedText.includes(key));

            if (matchedKey) {
                setSelectedMatch({ key: matchedKey, value: data_model[matchedKey] });
            } else {
                setSelectedMatch(null);
            }

            const extractedData = extractDataFromText(extractedText, data_model);
            setExtractedData(extractedData);
            const matchedData = matchData(extractedData, data_model);
            setMatchedData(matchedData);
        } catch (error) {
            console.error("Tesseract error:", error);
        }
    };
    const extractDataFromText = (text, dataModel) => {
        const extractedData = {};
        for (const [key, patterns] of Object.entries(dataModel)) {

            const pattern = key;
            const regex = new RegExp(`${pattern}:?\\s*([\\w\\d-/]+)`, "i");
            const match = text.match(regex);

            if (match) {
                console.log(`Matched ${key}: ${match[1]}`);
                extractedData[key] = match[1];
            } else {
                console.log(`No match for ${key}`);
            }
        }
        return extractedData;
    };

    // console.log("selectedMatch data", selectedMatch)

    return (
        <>
            <input type="file" onChange={handlePdfUpload} accept="application/pdf" />
            <div className="pdf-container">
                <div className="canvas-wrapper">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    ></canvas>
                </div>

                <div className="extracted-data-container">
                    <h3>Extracted Data on Upload:</h3>
                    <ul>
                        {Object.keys(matchedData).map((key) => (
                            <li key={key}>
                                <strong>{key}:</strong> {matchedData[key]}
                            </li>
                        ))}
                    </ul>
                </div>


                {/* Section for displaying data from selection */}
                <div className="selected-data-container">
                    {selectedMatch && (
                        <div>
                            <h3>Selected Match:</h3>
                            <p><strong>Key:</strong> {selectedMatch.key}</p>
                            <p><strong>Value:</strong> {selectedMatch.value}</p>
                        </div>
                    )}
                    <h3>Selected Data from Image:</h3>
                    <pre>{JSON.stringify(selectedText, null, 2)}</pre>
                </div>
            </div>
        </>
    );

};
export default PdfToImages;

// import React, { useState, useRef, useEffect } from "react";
// import * as pdfjsLib from "pdfjs-dist";
// import Tesseract from "tesseract.js";
// import "./invoice.css";

// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

// const PdfToImages = () => {
//     const [pdfFile, setPdfFile] = useState(null);
//     const [extractedData, setExtractedData] = useState({});
//     const canvasRef = useRef(null);
//     const contextRef = useRef(null);
//     const pdfImageData = useRef(null);
//     const data_model = {
//         // Your data model as previously defined
//         'invoice_number': ["Invoice No", "Invoice Number", "Invoice"],
//         'invoice_date': ["Invoice Date"],
//         // Add the rest of your data model
//     };

//     const handlePdfUpload = async (event) => {
//         const file = event.target.files[0];
//         if (file && file.type === "application/pdf") {
//             const fileUrl = URL.createObjectURL(file);
//             setPdfFile(fileUrl);
//             await convertToImagesAndExtractText(fileUrl);
//         }
//     };

//     const convertToImagesAndExtractText = async (fileUrl) => {
//         const loadingTask = pdfjsLib.getDocument(fileUrl);
//         const pdf = await loadingTask.promise;
//         const page = await pdf.getPage(1);
//         const viewport = page.getViewport({ scale: 2.0 });
//         const canvas = canvasRef.current;
//         const context = canvas.getContext("2d");
//         contextRef.current = context;
//         canvas.height = viewport.height;
//         canvas.width = viewport.width;
//         context.clearRect(0, 0, canvas.width, canvas.height);
//         await page.render({ canvasContext: context, viewport }).promise;
//         pdfImageData.current = context.getImageData(0, 0, canvas.width, canvas.height);

//         // Extract text and highlight
//         await extractTextAndHighlight(context, canvas);
//     };

//     const extractTextAndHighlight = async (context, canvas) => {
//         // Convert canvas to image URL for Tesseract
//         const imageURL = canvas.toDataURL("image/png");
//         const result = await Tesseract.recognize(imageURL, 'eng', {
//             logger: (m) => console.log(m),
//         });

//         const extractedText = result.data.text;
//         console.log("Extracted Text:", extractedText);

//         // Extract data from text based on the data model
//         const extractedData = extractDataFromText(extractedText, data_model);
//         setExtractedData(extractedData);

//         // Highlight matched text
//         result.data.words.forEach(word => {
//             for (const [key, patterns] of Object.entries(data_model)) {
//                 patterns.forEach(pattern => {
//                     const regex = new RegExp(`${pattern}`, "i");
//                     if (regex.test(word.text)) {
//                         // Highlight the word if it matches the data model
//                         highlightWord(context, word);
//                     }
//                 });
//             }
//         });
//     };

//     const highlightWord = (context, word) => {
//         const { x0, y0, x1, y1 } = word.bbox; // Bounding box of the word
//         context.beginPath();
//         context.strokeStyle = "red";
//         context.lineWidth = 2;
//         context.rect(x0, y0, x1 - x0, y1 - y0); // Draw a rectangle around the word
//         context.stroke();
//     };

//     const extractDataFromText = (text, dataModel) => {
//         const extractedData = {};
//         for (const [key, patterns] of Object.entries(dataModel)) {
//             for (const pattern of patterns) {
//                 const regex = new RegExp(`${pattern}:?\\s*([\\w\\d-/]+)`, "i");
//                 const match = text.match(regex);

//                 if (match) {
//                     extractedData[key] = match[1];
//                     break;
//                 }
//             }
//         }
//         return extractedData;
//     };

//     return (
//         <div>
//             <input type="file" onChange={handlePdfUpload} accept="application/pdf" />
//             <div className="pdf-container">
//                 <div className="pdf-image-container">
//                     <canvas
//                         ref={canvasRef}
//                         style={{ border: '1px solid black' }}
//                     ></canvas>
//                 </div>
//                 <div className="pdf-matches-container">
//                     <h3>Extracted Data:</h3>
//                     <pre>{JSON.stringify(extractedData, null, 2)}</pre>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default PdfToImages;
