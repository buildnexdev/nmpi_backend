/** Layout ratios for id-card-template.jpg (683×1024). Keep in sync with website/src/utils/idCardLayout.ts */
export const ID_CARD_LAYOUT = {
  photo: { x: 0.051, y: 0.389, w: 0.366, h: 0.349, radiusTop: 10, radiusBottom: 12 },
  name: { x: 0.449, y: 0.421, w: 0.33, h: 0.044 },
  bloodGroup: { x: 0.79, y: 0.421, w: 0.16, h: 0.034 },
  memberId: { x: 0.449, y: 0.511, w: 0.48, h: 0.034 },
  designation: { x: 0.449, y: 0.607, w: 0.50, h: 0.058 },
  expiry: { x: 0.449, y: 0.715, w: 0.50, h: 0.03 },
  qr: { x: 0.035, y: 0.757, size: 0.176 },
} as const;
