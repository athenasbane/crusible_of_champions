interface RuleTextProps {
  title: string;
  text: string;
}

export function RuleText({ title, text }: RuleTextProps) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        backgroundColor: "#f5f5f5",
        borderLeft: "4px solid #333",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0" }}>{title}</h4>
      <p style={{ margin: 0, fontSize: "0.95em", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}
