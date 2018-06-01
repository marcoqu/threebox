"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = require("three");
function makePerspectiveMatrix(fovy, aspect, near, far) {
    var out = new three_1.Matrix4();
    var f = 1.0 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out.elements[0] = f / aspect;
    out.elements[1] = 0;
    out.elements[2] = 0;
    out.elements[3] = 0;
    out.elements[4] = 0;
    out.elements[5] = f;
    out.elements[6] = 0;
    out.elements[7] = 0;
    out.elements[8] = 0;
    out.elements[9] = 0;
    out.elements[10] = (far + near) * nf;
    out.elements[11] = -1;
    out.elements[12] = 0;
    out.elements[13] = 0;
    out.elements[14] = (2 * far * near) * nf;
    out.elements[15] = 0;
    return out;
}
exports.makePerspectiveMatrix = makePerspectiveMatrix;
