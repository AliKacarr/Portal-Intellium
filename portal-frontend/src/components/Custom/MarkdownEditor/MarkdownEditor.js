import React, { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

const MarkdownEditor = ({
    value,
    onChange,
    placeholder,
    minHeight = 90,
    autoGrow = true,
}) => {
    const editorRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (!editorRef.current) {
            editorRef.current = new EasyMDE({
                element: textareaRef.current,
                initialValue: value,
                spellChecker: false,
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "code", "link", "image", "|",
                    "ordered-list", "|",
                    "preview"
                ],
                renderingConfig: {
                    singleLineBreaks: false,
                },
            });

            const resizeEditor = () => {
                if (!autoGrow) return;
                const codeMirror = editorRef.current?.codemirror;
                const wrapper = codeMirror?.getWrapperElement();
                const scroller = codeMirror?.getScrollerElement();
                if (!wrapper || !scroller) return;

                scroller.style.height = "auto";
                const nextHeight = Math.max(scroller.scrollHeight, minHeight);
                scroller.style.height = `${nextHeight}px`;
                scroller.style.overflowY = "hidden";
                wrapper.style.minHeight = `${minHeight}px`;
                wrapper.style.height = `${nextHeight}px`;
            };

            editorRef.current.codemirror.on("change", () => {
                onChange(editorRef.current.value());
                resizeEditor();
            });

            const wrapper = editorRef.current.codemirror.getWrapperElement();
            if (wrapper) {
                wrapper.style.minHeight = `${minHeight}px`;
            }

            const scroller = editorRef.current.codemirror.getScrollerElement();
            if (scroller) {
                scroller.style.minHeight = `${minHeight}px`;
            }
            resizeEditor();
        }
    }, [autoGrow, minHeight, onChange, value]);

    return <textarea ref={textareaRef} placeholder={placeholder} />;
};

export default MarkdownEditor;
