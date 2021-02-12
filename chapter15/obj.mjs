import fs from 'fs';
import path from 'path';
import { Point, Vector, Color } from './tuple.mjs';
import { Group } from './groups.mjs';
import { Triangle, SmoothTriangle } from './geometry.mjs';
import { Material } from './shading.mjs';
import { EPSILON } from './math.mjs';

export class ObjParser {
    constructor(options) {
        options = options || {};

        this.silent = options.hasOwnProperty('log') ? !options.log : true;
        this.errorsOk = !options.failOnError;
        this.ignoredLines = 0;
        this.vertices = [];
        this.defaultGroup = new Group('default');
        this.recentGroup = this.defaultGroup;
        this.groups = {
            default: this.defaultGroup,
        };
        this.normals = [];
        this.materials = {};
        this.recentMaterial = null; // material for newmtl
        this.currentMaterial = null; // material for usemtl
    }

    parse(filename) {
        this.objFileDir = path.dirname(filename);
        this.lines = this.loadFile(filename);

        this.silent || console.log(`[obj] Loaded ${filename} (${this.lines.length} lines)`);
        this.currentLine = -1;
        while (++this.currentLine < this.lines.length) {
            let line = this.lines[this.currentLine].trim();
            // ignore empty lines
            if (!line.length) {
                continue;
            }

            if (!this.parseLine(line)) {
                this.silent || console.log(`Parse error on line #${i + 1}`);
                this.errorsOk || this.error(`Parse error on line #${i + 1}`);
                this.ignoredLines++;
            }
        }
    }

    loadFile(filename) {
        if (!fs.existsSync(filename)) {
            this.error(`File not found: ${filename}`);
        }

        return fs.readFileSync(filename).toString('utf-8').split('\n');
    }

    parseLine(line) {
        if (line.charAt(0) === '#') {
            // skip empty lines and comments without tokenizing
            this.ignoredLines++;
            return true;
        }

        let tokens = line.split(' ');
        if (!tokens || !tokens.length) {
            this.silent || console.log(`[obj:${this.currentLine + 1}] No tokens found`);
            return false;
        }

        const statement = tokens.shift();

        // vertex
        if (statement === 'v') {
            const vertex = this.parseVertexStatement(tokens);
            if (vertex) {
                this.vertices.push(vertex);
                return true;
            }

            return false;
        }

        // face
        if (statement === 'f') {
            const triangles = this.parseFaceStatement(tokens);
            if (triangles.length) {
                if (this.recentGroup.children.length >= 7) {
                    this.recentGroup = new Group(null);
                    this.defaultGroup.add(this.recentGroup);
                }
                // assign material to triangles
                if (this.currentMaterial) {
                    for (const triangle of triangles) {
                        triangle.material = this.currentMaterial;
                    }
                }

                this.recentGroup.add(...triangles);
                return true;
            }

            return false;
        }

        // group
        if (statement === 'g') {
            const group = this.parseGroupStatement(tokens);
            if (group) {
                this.recentGroup = group;
                this.defaultGroup.add(group);
                return true;
            }

            return false;
        }

        // normals
        if (statement === 'vn') {
            const normal = this.parseVertexNormalStatement(tokens);
            if (normal) {
                this.normals.push(normal);
                return true;
            }
            return false;
        }

        if (statement === 'mtllib') {
            const lines = this.parseMtlLibStatement(tokens);
            if (lines && lines.length) {
                this.lines.splice(this.currentLine + 1, 0, ...lines);
                return true;
            }
            return false;
        }

        if (statement === 'newmtl') {
            const material = this.parseNewMtlStatement(tokens);
            if (material) {
                this.materials[material.id] = material;
                this.recentMaterial = material;
                return true;
            }
            return false;
        }

        if (statement === 'usemtl') {
            const material = this.parseUseMtlStatement(tokens);
            if (material) {
                this.currentMaterial = material;
                return true;
            }
            return false;
        }

        if (statement === 'Ka') {
            const color = this.parseColorStatement(tokens);
            if (color) {
                if (color.red + color.green + color.blue <= EPSILON) {
                    // ignore 0 ambient because that will cause the shading routine to show alway black
                    this.silent || console.log(`[obj:${this.currentLine + 1}] Ignoring black ambient color`);
                    return true;
                }

                if (!this.recentMaterial) {
                    this.silent || console.log(`[obj:${this.currentLine + 1}] No material specified`);
                    this.errorsOk || this.error(`[obj:${this.currentLine + 1}] No material specified`);

                    return false;
                }

                // average the colors because our ambient value is a scalar, but MTL specifies a tuple
                // to avoid assigning 0, I average all the channels
                this.recentMaterial.ambient = (color.red + color.green + color.blue) / 3;
                return true;
            }
            return false;
        }

        if (statement === 'Kd') {
            const color = this.parseColorStatement(tokens);
            if (color) {
                if (!this.recentMaterial) {
                    this.silent || console.log(`[obj:${this.currentLine + 1}] No material specified`);
                    this.errorsOk || this.error(`[obj:${this.currentLine + 1}] No material specified`);
                    return false;
                }

                // average the colors because our ambient value is a scalar, but MTL specifies a tuple
                // to avoid assigning 0, I average all the channels
                this.recentMaterial.color = color;
                return true;
            }
            return false;
        }

        if (statement === 'Ks') {
            const color = this.parseColorStatement(tokens);
            if (color) {
                if (!this.recentMaterial) {
                    this.silent || console.log(`[obj:${this.currentLine + 1}] No material specified`);
                    this.errorsOk || this.error(`[obj:${this.currentLine + 1}] No material specified`);
                    return false;
                }

                // average the colors because our ambient value is a scalar, but MTL specifies a tuple
                // to avoid assigning 0, I average all the channels
                this.recentMaterial.specular = (color.red + color.green + color.blue) / 3;
                return true;
            }
            return false;
        }

        this.silent || console.log(`[obj:${this.currentLine + 1}] Unrecognized statement line: ${line}`);
        return false;
    }

    /** Returns a Point from a vertex statement */
    parseVertexStatement(tokens) {
        if (tokens.length !== 3) {
            this.silent ||
                console.log(`[obj:${this.currentLine + 1}] Vertex statement does not have exactly 3 vertices:`, tokens);
            return false;
        }

        const x = parseFloat(tokens[0]);
        const y = parseFloat(tokens[1]);
        const z = parseFloat(tokens[2]);

        return new Point(x, y, z);
    }

    error(message) {
        throw new Error(message);
    }

    parseFaceStatement(tokens) {
        if (tokens.length < 3) {
            this.silent ||
                console.log(`[obj:${this.currentLine + 1}] Face statement does not have at least 3 vertices`, tokens);
            return false;
        }

        const polygonVertices = [];
        const polygonNormals = [];

        for (let i = 0; i < tokens.length; i++) {
            const indices = tokens[i].split('/');
            let vertexIndex = indices.length > 1 ? parseInt(indices[0]) - 1 : parseInt(indices[0]) - 1;
            let textureIndex = indices.length > 1 && !!indices[1] ? parseInt(indices[1]) - 1 : null;
            let normalIndex = indices.length > 2 && !!indices[2] ? parseInt(indices[2]) - 1 : null;

            if (vertexIndex < 0 || vertexIndex >= this.vertices.length) {
                this.silent ||
                    console.log(
                        `[obj:${this.currentLine + 1}] Error while parsing face: invalid vertex index`,
                        vertexIndex
                    );
                this.errorsOk ||
                    this.error(
                        `[obj:${this.currentLine + 1}] Error while parsing face: invalid vertex index ${vertexIndex}`
                    );
                continue;
            }

            polygonVertices.push(this.vertices[vertexIndex]);

            if (normalIndex !== null) {
                if (normalIndex < 0 || normalIndex >= this.normals.length) {
                    this.silent ||
                        console.log(
                            `[obj:${this.currentLine + 1}] Error while parsing face: invalid normal index`,
                            normalIndex
                        );
                    this.errorsOk ||
                        this.error(
                            `[obj:${
                                this.currentLine + 1
                            }] Error while parsing face: invalid normal index ${normalIndex}`
                        );
                    continue;
                }

                polygonNormals.push(this.normals[normalIndex]);
            }
        }

        return this.triangulate(polygonVertices, polygonNormals);
    }

    triangulate(vertices, normals) {
        const result = [];
        const v1 = vertices[0];
        const n1 = normals.length ? normals[0] : null;

        for (let i = 1; i < vertices.length - 1; i++) {
            const v2 = vertices[i];
            const n2 = normals.length ? normals[i] : null;

            const v3 = vertices[i + 1];
            const n3 = normals.length ? normals[i + 1] : null;

            result.push(normals.length ? new SmoothTriangle(v1, v2, v3, n1, n2, n3) : new Triangle(v1, v2, v3));
        }
        return result;
    }

    parseGroupStatement(tokens) {
        if (!tokens || !tokens.length) {
            this.silent || console.log(`[obj:${this.currentLine + 1}] Group statement does not specify a group name`);
            return false;
        }

        const groupName = tokens[0].trim();
        if (!groupName.length) {
            this.silent || console.log(`[obj:${this.currentLine + 1}] Empty group name`);
            this.errorsOk || this.error(`[obj:${this.currentLine + 1}] Empty group name`);
            return false;
        }

        if (!this.groups.hasOwnProperty(groupName)) {
            const group = new Group(groupName);
            this.groups[groupName] = group;
        }

        return this.groups[groupName];
    }

    group(name) {
        return this.groups[name];
    }

    toGroup() {
        return this.defaultGroup;
    }
    parseVertexNormalStatement(tokens) {
        if (tokens.length !== 3) {
            this.silent ||
                console.log(
                    `[obj:${this.currentLine + 1}] Vertex normal statement does not have exactly 3 vertices:`,
                    tokens
                );
            return false;
        }

        const x = parseFloat(tokens[0]);
        const y = parseFloat(tokens[1]);
        const z = parseFloat(tokens[2]);

        return new Vector(x, y, z);
    }

    parseMtlLibStatement(tokens) {
        if (!tokens.length) {
            this.silent ||
                console.log(`[obj:${this.currentLine + 1}] MTLLIB statement does not specify any files`, tokens);
            return false;
        }

        let all_lines = [];

        for (const filename of tokens) {
            const filepath = path.join(this.objFileDir, filename);
            this.silent || console.log(`[obj:${this.currentLine + 1}] Loading MTL from`, filepath);
            const lines = this.loadFile(filepath);
            if (lines && lines.length) {
                all_lines = all_lines.concat(lines);
            } else {
                this.silent || console.log(`[obj:${this.currentLine + 1}] Loading MTL from`, filepath);
                this.errorsOk || this.error(`[obj:${this.currentLine + 1}] Failed to load MTL: ${filepath}`);
            }
        }

        return all_lines;
    }

    parseNewMtlStatement(tokens) {
        if (!tokens.length) {
            this.silent ||
                console.log(`[obj:${this.currentLine + 1}] newmtel statement does not specify a material name`, tokens);
            return false;
        }

        const materialName = tokens[0].trim();
        if (!materialName.length) {
            this.silent || console.log(`[obj:${this.currentLine + 1}] Empty material name`);
            this.errorsOk || this.error(`[obj:${this.currentLine + 1}] Empty material name`);
            return false;
        }

        // create an empty material that will be populated by other statements
        const material = new Material();
        material.id = materialName;
        return material;
    }

    parseColorStatement(tokens) {
        if (tokens.length !== 3) {
            this.silent ||
                console.log(`[obj:${this.currentLine + 1}] Color statement does not have exactly 3 floats:`, tokens);
            return false;
        }

        const red = parseFloat(tokens[0]);
        const green = parseFloat(tokens[1]);
        const blue = parseFloat(tokens[2]);

        return new Color(red, green, blue);
    }

    parseUseMtlStatement(tokens) {
        if (!tokens || !tokens.length || !this.materials.hasOwnProperty(tokens[0])) {
            return new Material();
        }

        return this.materials[tokens[0]];
    }
}

export class ObjDirParser {
    constructor(options) {
        options = options || {};
    }

    parse(dirname) {
        const result = {};
        const objFiles = this.globObj(dirname);

        for (const objFile of objFiles) {
            const objectName = path.basename(objFile, '.obj');
            const parser = new ObjParser();
            parser.parse(path.join(dirname, objFile));
            result[objectName] = parser.toGroup();
        }

        return result;
    }

    globObj(dirname) {
        const result = [];
        for (const filename of fs.readdirSync(dirname)) {
            if (filename.endsWith('.obj')) {
                result.push(filename);
            }
        }

        return result;
    }
}
