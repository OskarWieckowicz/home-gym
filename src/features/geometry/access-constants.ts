/** Application conventions for walking checks. Not legal or accessibility standards. */
export const GRID_CELL_CM = 10;
/** Narrowest path still treated as walkable. Anything narrower makes a target unreachable. */
export const PASSABLE_WIDTH_CM = 75;
/** Path width treated as unconstrained. Between the two widths, access is reported as tight. */
export const COMFORT_WIDTH_CM = 100;
export const REACH_CM = 50;
/** Roughly one stair riser. Lower geometry is crossed on foot, not walked around. */
export const STEP_OVER_HEIGHT_CM = 20;

/** Orthogonal step in the 3/4 chamfer distance transform. */
export const CHAMFER_ORTHOGONAL = 3;
/** Diagonal step in the 3/4 chamfer distance transform. */
export const CHAMFER_DIAGONAL = 4;
