import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from 'tesseract.js';
import "./invoice.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const InvoiceUploadClone = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [images, setImages] = useState([]);
    const [matches, setMatches] = useState([]);
    const [selection, setSelection] = useState(null);
    const [selectedText, setSelectedText] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [extractDataFromText, setExtractedData] = useState(null);
    const [matchData, setMatchedData] = useState(null);
    const [unmatchedKeys, setUnmatchedKeys] = useState([]);
    const isSelectingRef = useRef(false);
    const selectionStart = useRef(null);
    const contextRef = useRef(null);
    const pdfImageData = useRef(null);
    const canvasRefs = useRef([]);
    const jsonData = {
        "Invoice No": "ARIN2425/4",
        "invoice_date": "31/03/2024",
        "vendor_name": "Not found",
        "GST NO": "Numbe 24AAYCS6904J1ZQ",
        "Date": "21/08/2024",
        "PAN No": "ABCS5688M",
        "StateCode": "09",
        "Contact": "Not found",
        "Vendor Contact": "Not found",
        "E-mail": "Not found",
        "Total Amount": "Before Tax 8,003.30",
        "After Tax Amount": "10,964.59",
        "Website": "Not found",
        "place_of_supply": "UTTAR PRADESH State",
        "CIN NO": "L25209GJ2017PLC097273",
        "Currency": "Not found",
        "Vehicle No": "Not found",
        "Agent Code": "Not found",
        "IRN No.": "Not found",
        "Payment Terms": "Not found",
        "Acknowledgement No.": "Not found",
        "Transporter": "Name",
        "Transportation Mode": "Not found",
        "Factory address": "Not found",
        "Office address": "Not found",
        "Vendor Address": "Not found",
        "LR No": "Not found",
        "LR Date": "Not found",
        "Party P.O. Ref": "AMAZON",
        "Purchase Order": "Not found",
        "Purchase PO Date": "Not found",
        "Declaration": "1) Certified that all the particulars given above are true and correct. The amounts indicated represents the price actually charged and",
        "Destination": "Not found",
        "Booking": "Not found",
    };
    const findMatches = async (fileUrl) => {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        let foundMatches = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item) => item.str);
            const textString = textItems.join(' ');

            Object.entries(jsonData).forEach(([key, value]) => {
                if (textString.includes(value)) {
                    const matchIndex = textItems.findIndex((text) => text.includes(value));
                    const matchText = textContent.items[matchIndex];

                    if (matchText) {
                        const { transform, width, height } = matchText;
                        const [scaleX, skewX, skewY, scaleY, x, y] = transform;
                        const canvasX = x * viewport.scale;
                        const canvasY = (viewport.height - y) * viewport.scale;
                        const scaledWidth = width * viewport.scale;
                        const scaledHeight = height * viewport.scale;

                        foundMatches.push({
                            key: key,
                            value: value,
                            x: canvasX,
                            y: canvasY,
                            width: scaledWidth,
                            height: scaledHeight,
                            page: i,
                        });

                        console.log("Match Found:", {
                            key: key,
                            value: value,
                            x: canvasX,
                            y: canvasY,
                            width: scaledWidth,
                            height: scaledHeight,
                            page: i,
                        });
                    }
                }
            });
        }
        setMatches(foundMatches);
        const foundKeys = foundMatches.map((match) => match.key);
        const unmatchedKeys = Object.keys(jsonData).filter((key) => !foundKeys.includes(key));
        setUnmatchedKeys(unmatchedKeys);
    };


    // const findMatches = async (fileUrl) => {
    //     const loadingTask = pdfjsLib.getDocument(fileUrl);
    //     const pdf = await loadingTask.promise;
    //     let foundMatches = [];

    //     const staticWidth = 892;
    //     const staticHeight = 1263;
    //     const scale = 1.5; // Optional: scale the static dimensions

    //     for (let i = 1; i <= pdf.numPages; i++) {
    //         const page = await pdf.getPage(i);
    //         const viewport = page.getViewport({ scale });
    //         const textContent = await page.getTextContent();
    //         const textItems = textContent.items.map((item) => item.str);
    //         const textString = textItems.join(' ');

    //         Object.entries(jsonData).forEach(([key, value]) => {
    //             if (textString.includes(value)) {
    //                 const matchIndex = textItems.findIndex((text) => text.includes(value));
    //                 const matchText = textContent.items[matchIndex];

    //                 if (matchText) {
    //                     const { transform, width, height } = matchText;
    //                     const [scaleX, skewX, skewY, scaleY, x, y] = transform;

    //                     // Use the static canvas size instead of dynamic viewport dimensions
    //                     const canvasX = (x / viewport.width) * staticWidth;
    //                     const canvasY = staticHeight - ((y / viewport.height) * staticHeight); // Adjust Y-coordinate for canvas
    //                     const scaledWidth = (width / viewport.width) * staticWidth;
    //                     const scaledHeight = (height / viewport.height) * staticHeight;

    //                     foundMatches.push({
    //                         key: key,
    //                         value: value,
    //                         x: canvasX,
    //                         y: canvasY,
    //                         width: scaledWidth,
    //                         height: scaledHeight,
    //                         page: i,
    //                     });

    //                     console.log("Match Found:", {
    //                         key: key,
    //                         value: value,
    //                         x: canvasX,
    //                         y: canvasY,
    //                         width: scaledWidth,
    //                         height: scaledHeight,
    //                         page: i,
    //                     });
    //                 }
    //             }
    //         });
    //     }

    //     setMatches(foundMatches);

    //     const foundKeys = foundMatches.map((match) => match.key);
    //     const unmatchedKeys = Object.keys(jsonData).filter((key) => !foundKeys.includes(key));
    //     setUnmatchedKeys(unmatchedKeys);
    // };

    const handlePdfUpload = async (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileUrl = URL.createObjectURL(file);
            setPdfFile(fileUrl);
            await convertToImages(fileUrl);
            await findMatches(fileUrl);
        }
    };

    const convertToImages = async (fileUrl) => {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const imagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            imagePromises.push(canvas.toDataURL("image/png"));
            console.log(" canvas.height", canvas.height)
        }
        const imageArray = await Promise.all(imagePromises);
        setImages(imageArray);
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
        context.putImageData(pdfImageData.current, 0, 0);  // Redraw the original image
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

        // Extract the selected area from the canvas
        const selectedImageData = context.getImageData(x, y, width, height);
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext("2d").putImageData(selectedImageData, 0, 0);

        const selectedImageURL = tempCanvas.toDataURL("image/png");

        try {
            const result = await Tesseract.recognize(selectedImageURL, 'eng', {
                logger: (m) => console.log(m),
            });

            const extractedText = result.data.text;
            setSelectedText(extractedText);
            console.log("Selected Text:", extractedText);

            const matchedKey = Object.keys(jsonData).find(key => extractedText.includes(key));
            if (matchedKey) {
                setSelectedMatch({ key: matchedKey, value: jsonData[matchedKey] });
            } else {
                setSelectedMatch(null);
            }

            // Handle data extraction and matching
            const extractedData = extractDataFromText(extractedText, jsonData);
            setExtractedData(extractedData);

            const matchedData = matchData(extractedData, jsonData);
            setMatchedData(matchedData);
        } catch (error) {
            console.error("Tesseract error:", error);
        }
    };

    const drawCanvas = (canvas, imageSrc, pageIndex) => {
        const img = new Image();
        img.src = imageSrc;

        img.onload = () => {
            const context = canvas.getContext("2d");
            contextRef.current = context;
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            pdfImageData.current = context.getImageData(0, 0, canvas.width, canvas.height);
            matches.forEach((match) => {
                if (match.page === pageIndex) {
                    context.fillStyle = 'rgba(255, 255, 0, 0.5)';
                    context.fillRect(match.x, canvas.height - match.y, match.width, match.height);
                }
            });
        };
    };


    useEffect(() => {
        if (images.length > 0) {
            images.forEach((image, index) => {
                const canvas = canvasRefs.current[index];
                if (canvas) {
                    drawCanvas(canvas, image, index + 1);
                }
            });
        }
    }, [images, matches]);

    return (
        <div>
            <input type="file" onChange={handlePdfUpload} accept="application/pdf" />
            <div className="pdf-container">
                <div className="pdf-image-container">
                    {images.map((image, index) => (
                        <div key={index} className="pdf-main-container">
                            <canvas
                                ref={(ref) => (canvasRefs.current[index] = ref)}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                            ></canvas>
                        </div>
                    ))}
                </div>
                <div className="pdf-matches-container">
                    {matches && matches.length > 0 && (
                        <div>
                            <h4>Matched Values:</h4>
                            {matches.map((match, index) => (
                                <div key={index}>
                                    {match.key}: {match.value}
                                </div>
                            ))}
                        </div>
                    )}
                    <h3>Selected Data from Image:</h3>
                    <pre>{JSON.stringify(selectedText, null, 2)}</pre>
                    <div>
                        <label>Select Unmatched Key: </label>
                        <select>
                            {unmatchedKeys.map((key, index) => (
                                <option key={index} value={key}>
                                    {key}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceUploadClone;
