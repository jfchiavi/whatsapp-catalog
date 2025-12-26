import { useState } from "react";

export const ProductGallery = ({ images }: { images: string[] }) => {
  const [active, setActive] = useState(images[0]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg">
        <img
          src={active}
          className="w-full h-80 object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <div className="flex gap-2">
        {images.map(img => (
          <img
            key={img}
            src={img}
            onClick={() => setActive(img)}
            className={`w-16 h-16 object-cover rounded cursor-pointer border
              ${active === img ? "border-primary" : "border-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
};
