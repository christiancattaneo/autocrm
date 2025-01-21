import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm min-h-[8rem] max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable: true,
  })

  return (
    <div className="border rounded-lg overflow-hidden bg-base-100">
      <div className="border-b bg-base-200 p-2 flex gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`btn btn-sm ${editor?.isActive('bold') ? 'btn-primary' : ''}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`btn btn-sm ${editor?.isActive('italic') ? 'btn-primary' : ''}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`btn btn-sm ${editor?.isActive('bulletList') ? 'btn-primary' : ''}`}
        >
          List
        </button>
      </div>
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
} 