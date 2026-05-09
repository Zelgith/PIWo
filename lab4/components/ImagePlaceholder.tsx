type ImagePlaceholderProps = {
  className?: string;
};

export function ImagePlaceholder({ className = "" }: ImagePlaceholderProps) {
  const combinedClassName = ["image-placeholder", className].filter(Boolean).join(" ");

  return <div className={combinedClassName}>Brak zdjęcia</div>;
}
