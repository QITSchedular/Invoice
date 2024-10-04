import React from 'react';
import { Button, Position, Tooltip, Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import {
    highlightPlugin,
    HighlightArea,
    RenderHighlightTargetProps,
    MessageIcon,
    RenderHighlightsProps,
} from '@react-pdf-viewer/highlight';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/core/lib/styles/index.css';

function Demo() {
    const [notes, setNotes] = React.useState([]);
    let noteId = notes.length;

    const renderHighlightTarget = (props) => (
        <div
            style={{
                background: '#eee',
                display: 'flex',
                position: 'absolute',
                left: `${props.selectionRegion.left}%`,
                top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
                transform: 'translate(0, 8px)',
                zIndex: 1,
            }}>
            <Tooltip
                position={Position.TopCenter}
                target={
                    <Button
                        onClick={() => {
                            props.toggle();

                            const note = {
                                id: ++noteId,
                                content: '',
                                highlightAreas: props.highlightAreas,
                                quote: props.selectedText,
                            };
                            setNotes(notes.concat([note]));
                            props.cancel();
                        }}>
                        <MessageIcon />
                    </Button>
                }
                content={() => <div style={{ width: '100px' }}>Add a note</div>}
                offset={{ left: 0, top: -8 }}
            />
        </div>
    );

    const renderHighlights = (props) => (
        <div>
            {notes.map((note) => (
                <React.Fragment key={note.id}>
                    {note.highlightAreas
                        .filter((area) => area.pageIndex === props.pageIndex)
                        .map((area, idx) => (
                            <div
                                key={idx}
                                style={Object.assign(
                                    {},
                                    {
                                        background: 'yellow',
                                        opacity: 0.4,
                                    },
                                    props.getCssProperties(area, props.rotation)
                                )}
                            />
                        ))}
                </React.Fragment>
            ))}
        </div>
    );

    const highlightPluginInstance = highlightPlugin({
        renderHighlightTarget,
        renderHighlights,
    });

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '1rem auto',
                border: '1px solid rgba(0, 0, 0, 0.3)',
                height: '1200px',
            }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer
                    defaultScale={1.5}
                    fileUrl="/mypdf.pdf"
                    plugins={[highlightPluginInstance]}
                />
            </Worker>
        </div>
    );
}

export default Demo;
