"use client";

export default function CardSizeSettings({
    cardDimensions,
    setCardDimensions,
}) {
    const formatSizes = {
        "59x86": { width: 59, height: 86 },
    };

    const handleWidthChange = (e) => {
        const newWidth = Number.parseFloat(e.target.value) || 59;
        const format = document.getElementById("cardFormat")?.value;

        if (formatSizes[format]) {
            const newHeight =
                (newWidth * formatSizes[format].height) /
                formatSizes[format].width;
            setCardDimensions({
                width: newWidth,
                height: Number.parseFloat(newHeight.toFixed(2)),
            });
        } else {
            setCardDimensions((prev) => ({ ...prev, width: newWidth }));
        }
    };

    const handleHeightChange = (e) => {
        const newHeight = Number.parseFloat(e.target.value) || 86;
        const format = document.getElementById("cardFormat")?.value;

        if (formatSizes[format]) {
            const newWidth =
                (newHeight * formatSizes[format].width) /
                formatSizes[format].height;
            setCardDimensions({
                width: Number.parseFloat(newWidth.toFixed(2)),
                height: newHeight,
            });
        } else {
            setCardDimensions((prev) => ({ ...prev, height: newHeight }));
        }
    };

    const handleFormatChange = (e) => {
        const format = e.target.value;
        if (format === "59x86") {
            setCardDimensions({ width: 59, height: 86 });
        } else if (format === "59x86-fit") {
            setCardDimensions({ width: 62, height: 90 });
        }
    };

    return (
        <fieldset className="mb-4 grid grid-cols-4 gap-1 border border-gray-300 p-2 rounded">
            <legend className="col-span-3 text-sm font-semibold">
                Kích thước card
            </legend>
            <input
                type="number"
                name="cardWidth"
                id="cardWidth"
                className="w-full p-1 border border-gray-300 rounded"
                placeholder="Chiều rộng thẻ (mm)"
                value={cardDimensions.width}
                onChange={handleWidthChange}
            />
            <input
                type="number"
                name="cardHeight"
                id="cardHeight"
                className="w-full p-1 border border-gray-300 rounded"
                placeholder="Chiều cao thẻ (mm)"
                value={cardDimensions.height}
                onChange={handleHeightChange}
            />
            <select
                name="cardFormat"
                id="cardFormat"
                className="w-full p-1 border border-gray-300 rounded col-span-2"
                onChange={handleFormatChange}
                defaultValue="59x86"
            >
                <option value="59x86">59x86</option>
                <option value="59x86-fit">59x86-fit</option>
                <option value="custom">Custom</option>
            </select>
        </fieldset>
    );
}
