"use client";

import React from "react";
import Image from "next/image";

interface ImagePreviewProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  border?: boolean;
}

export default function ImagePreview({
  src,
  alt,
  size = 300,
  className = "",
  border = false,
}: ImagePreviewProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-lg object-contain ${border ? "border-2 border-green-300" : ""} ${className}`}
      style={{ maxWidth: size, maxHeight: size }}
    />
  );
}