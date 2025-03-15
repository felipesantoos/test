import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  preview?: boolean;
  height?: number;
  readOnly?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  preview = false,
  height = 200,
  readOnly = false
}) => {
  if (preview || readOnly) {
    return (
      <div className="prose max-w-none">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          className="markdown-preview p-4 bg-gray-50 rounded-md"
        >
          {value || 'No description provided.'}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val)}
        preview="edit"
        height={height}
        hideToolbar={false}
        enableScroll={true}
        textareaProps={{
          placeholder: 'Write your description here using Markdown...\n\nSupported formatting:\n- **Bold**\n- *Italic*\n- # Headings\n- Lists\n- [Links](url)\n- ```Code blocks```'
        }}
      />
    </div>
  );
};
