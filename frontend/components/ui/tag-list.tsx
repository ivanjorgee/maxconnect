import { useState, KeyboardEvent } from "react";
import { Input } from "./input";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
};

export function TagList({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const tag = draft.trim();
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-muted hover:text-foreground">
              ×
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={addTag}
        placeholder={placeholder ?? "Digite e pressione Enter para adicionar"}
      />
    </div>
  );
}
