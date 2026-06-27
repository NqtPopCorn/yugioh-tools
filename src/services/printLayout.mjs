const A4_PAGE = {
    width: 210,
    height: 297,
};

const DEFAULT_MARGIN = 10;
const DEFAULT_GAP = 0;

export const getCardPlacements = (
    cardCount,
    cardDimensions,
    page = A4_PAGE,
    margin = DEFAULT_MARGIN,
    gap = DEFAULT_GAP
) => {
    const placements = [];
    const cardW = cardDimensions.width;
    const cardH = cardDimensions.height;
    let pageIndex = 0;
    let x = margin;
    let y = margin;

    for (let i = 0; i < cardCount; i++) {
        placements.push({ page: pageIndex, x, y });

        if (i === cardCount - 1) {
            break;
        }

        let nextX = x + cardW + gap;
        let nextY = y;

        if (nextX + cardW > page.width) {
            nextX = margin;
            nextY = y + cardH + gap;
        }

        if (nextY + cardH > page.height) {
            pageIndex += 1;
            nextX = margin;
            nextY = margin;
        }

        x = nextX;
        y = nextY;
    }

    return placements;
};
