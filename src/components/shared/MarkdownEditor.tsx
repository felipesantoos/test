import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  preview?: boolean;
  height?: number;
  readOnly?: boolean;
}

// Extended schema to allow task lists and other elements
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    input: [...(defaultSchema.attributes?.input || []), ['type', 'checkbox'], ['checked', 'boolean']],
    th: [...(defaultSchema.attributes?.th || []), ['align', 'left', 'center', 'right']],
    td: [...(defaultSchema.attributes?.td || []), ['align', 'left', 'center', 'right']],
    div: [...(defaultSchema.attributes?.div || []), ['className', 'data-task-list']]
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'input',
    'del',
    'h4',
    'h5',
    'h6'
  ]
};

// Custom components for rendering
const components = {
  // Task list items
  li: ({ node, checked, children, ...props }: any) => {
    if (typeof checked === 'boolean') {
      return (
        <li className="flex items-start space-x-2 my-1" {...props}>
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>{children}</span>
        </li>
      );
    }
    return <li {...props}>{children}</li>;
  },
  // Strikethrough text
  del: ({ children }: any) => (
    <del className="line-through">{children}</del>
  ),
  // Additional heading levels
  h4: ({ children }: any) => (
    <h4 className="text-base font-semibold mb-2 mt-3">{children}</h4>
  ),
  h5: ({ children }: any) => (
    <h5 className="text-sm font-semibold mb-2 mt-3">{children}</h5>
  ),
  h6: ({ children }: any) => (
    <h6 className="text-xs font-semibold mb-2 mt-3">{children}</h6>
  ),
  // Table elements
  table: ({ children }: any) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gray-50">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
  ),
  th: ({ children, align }: any) => (
    <th className={`px-6 py-3 text-${align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
      {children}
    </th>
  ),
  td: ({ children, align }: any) => (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-${align || 'left'}`}>
      {children}
    </td>
  )
};

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
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeRaw, 
            [rehypeSanitize, schema]
          ]}
          components={components}
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
          placeholder: 'Write your description here using Markdown...\n\nSupported formatting:\n- **Bold** and *Italic*\n- # Headings (h1-h6)\n- Lists and Task Lists\n  - [ ] Unchecked task\n  - [x] Checked task\n- ~~Strikethrough~~\n- Tables\n- [Links](url)\n- ```Code blocks```'
        }}
      />
    </div>
  );
};
