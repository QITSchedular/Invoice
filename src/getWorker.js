export const getWorker = () => {
    try {
        return require('react-pdf/node_modules/pdfjs-dist/legacy/build/pdf.worker.entry.js')
    } catch {
        return require('pdfjs-dist/legacy/build/pdf.worker.entry.js')
    }
}