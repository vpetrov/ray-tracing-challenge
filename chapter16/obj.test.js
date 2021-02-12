import { ObjParser } from './obj.mjs';
import { Point, Vector } from './tuple.mjs';

test('Ignoring unrecognized lines', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/gibberish.obj');
    expect(parser.ignoredLines).toEqual(5);
});

test('Vertex records', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/vertex_only.obj');
    const vertices = parser.vertices;

    expect(vertices[0].equals(new Point(-1, 1, 0))).toBeTruthy();
    expect(vertices[1].equals(new Point(-1, 0.5, 0))).toBeTruthy();
    expect(vertices[2].equals(new Point(1, 0, 0))).toBeTruthy();
    expect(vertices[3].equals(new Point(1, 1, 0))).toBeTruthy();
});

test('The parser should process triangle data from the given input', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/faces.obj');
    const g = parser.defaultGroup;
    const t1 = g.child(0);
    const t2 = g.child(1);

    expect(t1.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t1.p2.equals(parser.vertices[1])).toBeTruthy();
    expect(t1.p3.equals(parser.vertices[2])).toBeTruthy();
    expect(t2.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t2.p2.equals(parser.vertices[2])).toBeTruthy();
    expect(t2.p3.equals(parser.vertices[3])).toBeTruthy();
});

test('Triangulating polygons', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/polygon.obj');
    const g = parser.defaultGroup;
    const t1 = g.child(0);
    const t2 = g.child(1);
    const t3 = g.child(2);

    expect(t1.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t1.p2.equals(parser.vertices[1])).toBeTruthy();
    expect(t1.p3.equals(parser.vertices[2])).toBeTruthy();
    expect(t2.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t2.p2.equals(parser.vertices[2])).toBeTruthy();
    expect(t2.p3.equals(parser.vertices[3])).toBeTruthy();
    expect(t3.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t3.p2.equals(parser.vertices[3])).toBeTruthy();
    expect(t3.p3.equals(parser.vertices[4])).toBeTruthy();
});

test('Triangles in groups', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/groups.obj');
    const g1 = parser.group('FirstGroup');
    const g2 = parser.group('SecondGroup');
    const t1 = g1.child(0);
    const t2 = g2.child(0);

    expect(t1.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t1.p2.equals(parser.vertices[1])).toBeTruthy();
    expect(t1.p3.equals(parser.vertices[2])).toBeTruthy();
    expect(t2.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t2.p2.equals(parser.vertices[2])).toBeTruthy();
    expect(t2.p3.equals(parser.vertices[3])).toBeTruthy();
});

test('Convering an OBJ file to a group', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/groups.obj');
    const g = parser.toGroup();
    expect(g.child('FirstGroup')).toBeTruthy();
    expect(g.child('SecondGroup')).toBeTruthy();
});

test('Can parse a real world cube.obj', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/cube.obj');
    expect(parser.ignoredLines).toEqual(6);
});

test('Vertex normal records', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/normals.obj');
    expect(parser.normals[0].equals(new Vector(0, 0, 1))).toBeTruthy();
    expect(parser.normals[1].equals(new Vector(0.707, 0, -0.707))).toBeTruthy();
    expect(parser.normals[2].equals(new Vector(1, 2, 3))).toBeTruthy();
});

test('Faces with normals', () => {
    const parser = new ObjParser();
    parser.parse('./assets/tests/faces_with_normals.obj');
    const group = parser.toGroup();
    const t1 = group.childAt(0);
    const t2 = group.childAt(1);

    expect(t1.p1.equals(parser.vertices[0])).toBeTruthy();
    expect(t1.p2.equals(parser.vertices[1])).toBeTruthy();
    expect(t1.p3.equals(parser.vertices[2])).toBeTruthy();
    expect(t1.n1.equals(parser.normals[2])).toBeTruthy();
    expect(t1.n2.equals(parser.normals[0])).toBeTruthy();
    expect(t1.n3.equals(parser.normals[1])).toBeTruthy();
    expect(t2.equals(t1)).toBeTruthy();
});
