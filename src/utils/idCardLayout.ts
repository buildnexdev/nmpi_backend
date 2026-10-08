/** Layout ratios for id-card-template.jpg (~683×1024). Keep in sync with website/src/utils/idCardLayout.ts */
export const ID_CARD_LAYOUT = {
  photo: { x: 0.042, y: 0.395, w: 0.242, h: 0.202 },
  name: { x: 0.545, y: 0.365, w: 0.42, h: 0.028 },
  memberId: { x: 0.545, y: 0.398, w: 0.42, h: 0.026 },
  phone: { x: 0.545, y: 0.431, w: 0.42, h: 0.026 },
  bloodGroup: { x: 0.545, y: 0.464, w: 0.42, h: 0.026 },
  designation: { x: 0.545, y: 0.497, w: 0.42, h: 0.032 },
  expiry: { x: 0.718, y: 0.548, w: 0.22, h: 0.026 },
  qr: { x: 0.055, y: 0.748, size: 0.198 },
} as const;
