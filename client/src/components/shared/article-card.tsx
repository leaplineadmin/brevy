import { Link } from "wouter";
import React from "react";

interface ArticleCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  link: string;
  date?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  title,
  description,
  imageUrl,
  link,
  date,
}) => {
  return (
    <Link href={link}>
      <div className="bg-white rounded-xl shadow-lg p-2 hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        {imageUrl && (
          <div className="mb-2">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto rounded-lg object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <div className="cardContent p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-[#1a1a2e] text-center mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-center leading-relaxed flex-1">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

