import fs from 'fs';
import { Point, Vector } from './tuple.mjs';
import { Group } from './groups.mjs';
import { Triangle, SmoothTriangle } from './geometry.mjs';

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
    }

    parse(filename) {
        const lines = this.loadFile(filename).toString('utf-8').split('\n');

        this.silent || console.log(`[obj] Loaded ${filename} (${lines.length} lines)`);
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
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

        return fs.readFileSync(filename);
    }

    parseLine(line) {
        if (line.charAt(0) === '#') {
            // skip empty lines and comments without tokenizing
            this.ignoredLines++;
            return true;
        }

        let tokens = line.split(' ');
        if (!tokens || !tokens.length) {
            this.silent || console.log(`[obj] No tokens found`);
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
                    this.recentGroup = new Group();
                    this.defaultGroup.add(this.recentGroup);
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

        this.silent || console.log(`[obj] Unrecognized statement line: ${line}`);
        return false;
    }

    /** Returns a Point from a vertex statement */
    parseVertexStatement(tokens) {
        if (tokens.length !== 3) {
            this.silent || console.log('[obj] Vertex statement does not have exactly 3 vertices:', tokens);
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
            this.silent || console.log('[obj] Face statement does not have at least 3 vertices', tokens);
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
                this.silent || console.log('[obj] Error while parsing face: invalid vertex index', vertexIndex);
                this.errorsOk || this.error(`'[obj] Error while parsing face: invalid vertex index ${vertexIndex}`);
                continue;
            }

            polygonVertices.push(this.vertices[vertexIndex]);

            if (normalIndex !== null) {
                if (normalIndex < 0 || normalIndex >= this.normals.length) {
                    this.silent || console.log('[obj] Error while parsing face: invalid normal index', normalIndex);
                    this.errorsOk || this.error(`'[obj] Error while parsing face: invalid normal index ${normalIndex}`);
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
            this.silent || console.log('[obj] Group statement does not specify a group name');
            return false;
        }

        const groupName = tokens[0].trim();
        if (!groupName.length) {
            this.silent || console.log('[obj] Empty group name');
            this.errorsOk || this.error(`[obj] Empty group name`);
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
            this.silent || console.log('[obj] Vertex normal statement does not have exactly 3 vertices:', tokens);
            return false;
        }

        const x = parseFloat(tokens[0]);
        const y = parseFloat(tokens[1]);
        const z = parseFloat(tokens[2]);

        return new Vector(x, y, z);
    }
}
