/**
 * Hexagonal Grid Utilities
 * Functions for working with hexagonal grids and coordinate systems
 */

class HexUtils {
    /**
     * Hexagon size constants
     */
    static HEX_SIZE = 30; // pixels
    static HEX_SPACING = 5; // pixels between hexes

    /**
     * Convert cube coordinates to axial coordinates
     * @param {Object} cube - Cube coordinates {x, y, z}
     * @returns {Object} Axial coordinates {q, r}
     */
    static cubeToAxial(cube) {
        return {
            q: cube.x,
            r: cube.z
        };
    }

    /**
     * Convert axial coordinates to cube coordinates
     * @param {Object} axial - Axial coordinates {q, r}
     * @returns {Object} Cube coordinates {x, y, z}
     */
    static axialToCube(axial) {
        return {
            x: axial.q,
            y: -axial.q - axial.r,
            z: axial.r
        };
    }

    /**
     * Convert axial coordinates to pixel coordinates (offset coordinates)
     * @param {Object} axial - Axial coordinates {q, r}
     * @param {number} centerX - X coordinate of grid center
     * @param {number} centerY - Y coordinate of grid center
     * @returns {Object} Pixel coordinates {x, y}
     */
    static axialToPixel(axial, centerX = 0, centerY = 0) {
        const size = this.HEX_SIZE;
        const x = size * (3/2 * axial.q);
        const y = size * (Math.sqrt(3)/2 * axial.q + Math.sqrt(3) * axial.r);
        
        return {
            x: x + centerX,
            y: y + centerY
        };
    }

    /**
     * Convert pixel coordinates to axial coordinates
     * @param {number} x - Pixel X coordinate
     * @param {number} y - Pixel Y coordinate
     * @param {number} centerX - X coordinate of grid center
     * @param {number} centerY - Y coordinate of grid center
     * @returns {Object} Axial coordinates {q, r}
     */
    static pixelToAxial(x, y, centerX = 0, centerY = 0) {
        const size = this.HEX_SIZE;
        x -= centerX;
        y -= centerY;

        const q = (2/3 * x) / size;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;

        return this.roundAxial(q, r);
    }

    /**
     * Round axial coordinates to nearest hex
     * @param {number} q - Q coordinate
     * @param {number} r - R coordinate
     * @returns {Object} Rounded axial coordinates {q, r}
     */
    static roundAxial(q, r) {
        let cube = this.axialToCube({ q, r });
        cube = this.roundCube(cube);
        return this.cubeToAxial(cube);
    }

    /**
     * Round cube coordinates to nearest hex
     * @param {Object} cube - Cube coordinates {x, y, z}
     * @returns {Object} Rounded cube coordinates
     */
    static roundCube(cube) {
        let rx = Math.round(cube.x);
        let ry = Math.round(cube.y);
        let rz = Math.round(cube.z);

        const xDiff = Math.abs(rx - cube.x);
        const yDiff = Math.abs(ry - cube.y);
        const zDiff = Math.abs(rz - cube.z);

        if (xDiff > yDiff && xDiff > zDiff) {
            rx = -ry - rz;
        } else if (yDiff > zDiff) {
            ry = -rx - rz;
        } else {
            rz = -rx - ry;
        }

        return { x: rx, y: ry, z: rz };
    }

    /**
     * Get distance between two hexes
     * @param {Object} a - First hex (axial coordinates)
     * @param {Object} b - Second hex (axial coordinates)
     * @returns {number} Distance in hex steps
     */
    static distance(a, b) {
        const aCube = this.axialToCube(a);
        const bCube = this.axialToCube(b);
        
        return (Math.abs(aCube.x - bCube.x) +
                Math.abs(aCube.y - bCube.y) +
                Math.abs(aCube.z - bCube.z)) / 2;
    }

    /**
     * Get all hexes within a certain distance
     * @param {Object} center - Center hex (axial coordinates)
     * @param {number} radius - Radius in hex steps
     * @returns {Array} Array of axial coordinates
     */
    static getHexesInRadius(center, radius) {
        const hexes = [];
        const cube = this.axialToCube(center);

        for (let x = cube.x - radius; x <= cube.x + radius; x++) {
            for (let y = Math.max(cube.y - radius, -x - radius); 
                 y <= Math.min(cube.y + radius, -x + radius); y++) {
                const z = -x - y;
                const dist = (Math.abs(cube.x - x) + Math.abs(cube.y - y) + Math.abs(cube.z - z)) / 2;
                if (dist <= radius) {
                    hexes.push(this.cubeToAxial({ x, y, z }));
                }
            }
        }

        return hexes;
    }

    /**
     * Get neighbors of a hex
     * @param {Object} hex - Hex coordinates (axial)
     * @returns {Array} Array of neighbor coordinates
     */
    static getNeighbors(hex) {
        const directions = [
            { q: 1, r: 0 },
            { q: 1, r: -1 },
            { q: 0, r: -1 },
            { q: -1, r: 0 },
            { q: -1, r: 1 },
            { q: 0, r: 1 }
        ];

        return directions.map(dir => ({
            q: hex.q + dir.q,
            r: hex.r + dir.r
        }));
    }

    /**
     * Get line between two hexes
     * @param {Object} a - First hex (axial coordinates)
     * @param {Object} b - Second hex (axial coordinates)
     * @returns {Array} Array of hexes on the line
     */
    static getLine(a, b) {
        const distance = this.distance(a, b);
        const hexes = [];

        for (let i = 0; i <= distance; i++) {
            const t = distance === 0 ? 0 : i / distance;
            const interpolated = {
                x: a.q + (b.q - a.q) * t,
                y: 0, // y is always 0 in axial
                z: a.r + (b.r - a.r) * t
            };
            
            const cubeA = this.axialToCube(a);
            interpolated.y = -interpolated.x - interpolated.z;
            
            hexes.push(this.cubeToAxial(this.roundCube(interpolated)));
        }

        return hexes;
    }

    /**
     * Check if a coordinate is in a winning line
     * @param {Array} board - Board state with hex placements
     * @param {Object} hex - Hex to check (axial coordinates)
     * @param {string} player - Player identifier ('BLUE' or 'RED')
     * @param {number} lineLength - Required line length (default 6)
     * @returns {boolean} True if the hex is part of a winning line
     */
    static isWinningMove(board, hex, player, lineLength = 6) {
        const directions = [
            { q: 1, r: 0 },   // East
            { q: 0, r: 1 },   // Southwest
            { q: -1, r: 1 },  // West
        ];

        for (const dir of directions) {
            let count = 1; // Count the current hex

            // Check in positive direction
            for (let i = 1; i < lineLength; i++) {
                const nextHex = {
                    q: hex.q + (dir.q * i),
                    r: hex.r + (dir.r * i)
                };
                if (this.getBoardHex(board, nextHex) === player) {
                    count++;
                } else {
                    break;
                }
            }

            // Check in negative direction
            for (let i = 1; i < lineLength; i++) {
                const nextHex = {
                    q: hex.q - (dir.q * i),
                    r: hex.r - (dir.r * i)
                };
                if (this.getBoardHex(board, nextHex) === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= lineLength) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get a hex from the board
     * @param {Array} board - Board state
     * @param {Object} hex - Hex coordinates to find
     * @returns {string|null} Player identifier or null if empty
     */
    static getBoardHex(board, hex) {
        const found = board.find(h => h.q === hex.q && h.r === hex.r);
        return found ? found.player : null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HexUtils;
}
