import type { BuildInput } from "../engine/schema";

export const CharacterNameInput = ({
  input,
  setCharacterName,
}: {
  input: BuildInput;
  setCharacterName: (name: string) => void;
}) => {
  return (
    <div className="builder-faction-row">
      <label className="builder-label" htmlFor="character-name-input">
        Character Name (optional)
      </label>
      <input
        id="character-name-input"
        className="builder-select"
        type="text"
        autoComplete="off"
        autoCorrect="off"
        value={input.name ?? ""}
        onChange={(event) => setCharacterName(event.target.value)}
        placeholder="Enter character name"
      />
    </div>
  );
};
