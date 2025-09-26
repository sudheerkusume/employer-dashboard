import Image from "next/image";
import { useEffect, useState } from "react";

const shimmer = (w, h) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f0f8ff" offset="20%" />
      <stop stop-color="#f0f8ff" offset="50%" />
      <stop stop-color="#f0f8ff" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f0f8ff" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str) =>
    typeof window === 'undefined'
        ? Buffer.from(str).toString('base64')
        : window.btoa(str)

export function CustomImage(props) {
    const { src, alt, width, height, priority, className, fill, sizes, skeleton } = props;
    const imageKitLoader = ({ src, width, quality }) => {
        const params = [`w-${width}`];
        if (quality) {
            params.push(`q-${quality}`);
        }
        const paramsString = params.join(",");
        return `${src}?tr=${paramsString}`;
    };

    const [source, setSource] = useState(src);


    useEffect(() => {
        setSource(src)
    }, [src])

    return (
        <Image
            className={`${className}`}
            src={source}
            alt={alt}
            width={width}
            height={height}
            loader={imageKitLoader}
            priority={priority}
            onError={() => setSource("https://images.travelxp.com/images/txpin/vector/general/errorimage.svg")}
            fill={fill}
            sizes={sizes}
            placeholder={skeleton && "blur"}
            blurDataURL={skeleton && `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
        />
    );
}
