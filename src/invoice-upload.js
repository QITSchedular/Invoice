import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "./invoice.css"

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const PdfToImages = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [images, setImages] = useState([]);
    const [jsonData, setJsonData] = useState({
        "invoice_number": "",
        "invoice_date": "",
        "vendor_name": "",
        "GST NO": "",
        "PAN No": "",
        "StateCode": "",
        "Contact Detail": "",
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
        "Transporter": "",
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
        "Booking": ""
    });
    const [matches, setMatches] = useState([]);
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

            // Render the page
            await page.render({ canvasContext: context, viewport }).promise;

            // Highlight matched text
            matches.forEach(match => {
                if (match.page === i) {
                    context.fillStyle = 'rgba(255, 255, 0, 0.5)'; // yellow highlight with transparency
                    context.fillRect(match.x, viewport.height - match.y, match.width, match.height); // Y-axis is inverted
                }
            });

            imagePromises.push(canvas.toDataURL("image/png"));
        }

        const imageArray = await Promise.all(imagePromises);
        setImages(imageArray);
    };

    const findMatches = async (fileUrl) => {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const matchesFound = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            for (const item of textContent.items) {
                const str = item.str;
                const transform = item.transform;  // Contains position (x, y) and scale

                for (const key in jsonData) {
                    const regex = new RegExp(`${key}\\s*:?\\s*([^\\s]+)`, 'i');
                    const match = str.match(regex);

                    if (match) {
                        const value = match[1];

                        // Store the matched key, value, and the position (x, y, width, height) for highlighting
                        matchesFound.push({
                            key: key,
                            value: value,
                            x: transform[4], // x position
                            y: transform[5], // y position
                            width: item.width,  // width of the text item
                            height: item.height,  // height of the text item
                            page: i
                        });
                    }
                }
            }
        }
        setMatches(matchesFound);
    };
    return (
        <div>
            <input type="file" onChange={handlePdfUpload} accept="application/pdf" />
            <div className="pdf-container">
                <div className="pdf-image-container">
                    {images.map((image, index) => (
                        <div key={index} className="pdf-main-container">
                            <img src={image} alt={`Page ${index + 1}`} />
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
                </div>
            </div>
        </div>
    );
};

export default PdfToImages;
