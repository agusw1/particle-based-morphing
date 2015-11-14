/**
 * Created by w1 on 9/17/2015.
 */


var w1 = {};
w1.utils = {};
w1.utils.randomPointInTriangle = function () {
    /**
     * Given three vertices of a triangle, return random point inside it.
     * @param {THREE.Vector3} vA A Vertex of triangle
     * @param {THREE.Vector3} vB A Vertex of triangle
     * @param {THREE.Vector3} vC A Vertex of triangle
     * @returns {THREE.Vector3} The new random point in triangle
     */
    var cache = new THREE.Vector3();
    return function (vA, vB, vC) {
        var a = THREE.Math.random16();
        var b = THREE.Math.random16();
        if ((a + b) > 1) {
            a = 1 - a;
            b = 1 - b;
        }
        var c = 1 - a - b;
        var out = new THREE.Vector3();
        out.copy(vA).multiplyScalar(a);
        out.add(cache.copy(vB).multiplyScalar(b));
        out.add(cache.copy(vC).multiplyScalar(c));
        return out;
    };
}();

w1.utils.randomPointInGeometry = function (geometry, n) {
    /**
     * Get n uniformly distributed random points in a geometry mesh.
     *
     * @param {THREE.Geometry} geometry Input geometry
     * @param {Number} n Number of points desired
     * @returns {Array} The generated random points
     */
    var face, i,
        faces = geometry.faces,
        vertices = geometry.vertices,
        totalArea = 0,
        cumulativeAreas = [];

    // compute face areas
    for (i = 0; i < faces.length; i ++ ) {
        face = faces[i];
        totalArea += w1.utils.triangleArea(vertices[face.a],
            vertices[face.b], vertices[face.c]);
        cumulativeAreas[i] = totalArea;
    }

    // binary search
    function binarySearchIndices(value) {
        function binarySearch(start, end) {
            if (end < start) {
                return start;
            }
            var mid = start + Math.floor((end-start)/2);
            if (cumulativeAreas[mid] > value) {
                return binarySearch(start, mid - 1);
            } else if (cumulativeAreas[mid] < value) {
                return binarySearch(mid + 1, end);
            } else {
                return mid;
            }
        }
        return binarySearch(0, cumulativeAreas.length - 1);
    }

    // pick n random area weighted face
    var out = [], offsetArea, index;
    for (i = 0; i < n; i ++) {
        offsetArea = THREE.Math.random16() * totalArea;
        index = binarySearchIndices(offsetArea);
        out[i] = w1.utils.randomPointInTriangle(
            vertices[faces[index].a],
            vertices[faces[index].b],
            vertices[faces[index].c]);
    }
    return out;
};

w1.utils.triangleArea = function () {
    /**
     * Get area of a triangle
     *
     * @param {THREE.Vector3} vA A vertex of triangle
     * @param {THREE.Vector3} vB A vertex of triangle
     * @param {THREE.Vector3} vC A vertex of triangle
     * @returns {Number} Area of triangle
     */
    var cache1 = new THREE.Vector3();
    var cache2 = new THREE.Vector3();
    return function (vA, vB, vC) {
        cache1.subVectors(vB, vA);
        cache2.subVectors(vC, vA);
        return cache1.cross(cache2).length() * 0.5;
    };
}();
