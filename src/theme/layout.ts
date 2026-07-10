import { useWindowDimensions } from 'react-native';

/** The app is a centered column that never sprawls past this on big screens. */
export const CONTENT_MAX_WIDTH = 1120;

export interface Layout {
  width: number;
  height: number;
  isWide: boolean;
  /** Actual usable content width (capped, minus padding). */
  contentWidth: number;
  horizontalPadding: number;
  /** Columns for the list-card grid at this width. */
  columns: number;
  gutter: number;
  /** Pixel width of one card in the grid. */
  cardWidth: number;
}

const GUTTER = 16;
const MIN_CARD = 240;

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = width < 480 ? 16 : 24;
  const capped = Math.min(width, CONTENT_MAX_WIDTH);
  const contentWidth = capped - horizontalPadding * 2;
  const columns = Math.max(1, Math.floor((contentWidth + GUTTER) / (MIN_CARD + GUTTER)));
  const cardWidth = (contentWidth - GUTTER * (columns - 1)) / columns;
  return {
    width,
    height,
    isWide: width >= 720,
    contentWidth,
    horizontalPadding,
    columns,
    gutter: GUTTER,
    cardWidth,
  };
}
