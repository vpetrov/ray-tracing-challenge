import { Color } from './tuple.mjs';
import { eqf } from './math.mjs';
import { World, IntersectionInfo } from './geometry.mjs';
import { Pattern } from './patterns.mjs';

export class PointLight {
    constructor(position, intensity) {
        this.position = position === undefined ? new Point(0, 0, 0) : position;
        this.intensity = intensity === undefined ? new Color(1, 1, 1) : intensity;
    }

    equals(that) {
        return that != null && this.position.equals(that.position) && this.intensity.equals(that.intensity);
    }
}

export class Material {
    constructor(colorOrPattern, ambient, diffuse, specular, shininess, reflective, refractive, transparency) {
        if (colorOrPattern instanceof Pattern) {
            this.pattern = colorOrPattern;
            this.color = Color.BLACK;
        } else if (colorOrPattern instanceof Color) {
            this.pattern = undefined;
            this.color = colorOrPattern;
        } else {
            this.pattern = undefined;
            this.color = Color.WHITE;
        }
        this.ambient = ambient === undefined ? 0.1 : ambient;
        this.diffuse = diffuse === undefined ? 0.9 : diffuse;
        this.specular = specular === undefined ? 0.9 : specular;
        this.shininess = shininess === undefined ? 200.0 : shininess;
        this.reflective = reflective === undefined ? 0.0 : reflective;
        this.refractive = refractive === undefined ? 1.0 : refractive;
        this.transparency = transparency === undefined ? 0.0 : transparency;
        this.id = null;
    }

    equals(that) {
        return (
            that != null &&
            this.color.equals(that.color) &&
            eqf(this.ambient, that.ambient) &&
            eqf(this.diffuse, that.diffuse) &&
            eqf(this.specular, that.specular) &&
            eqf(this.shininess, that.shininess)
        );
    }

    clone() {
        const result = new Material(
            undefined,
            this.ambient,
            this.diffuse,
            this.specular,
            this.shininess,
            this.reflective,
            this.refractive,
            this.transparency
        );
        result.pattern = this.pattern === undefined ? undefined : this.pattern.clone();
        result.color = this.color.clone();
        return result;
    }
}

export class Phong {
    static getObjectAndMaterial(objectOrMaterial) {
        let object = undefined;
        let material = undefined;

        if (objectOrMaterial instanceof Material) {
            material = objectOrMaterial;
        } else {
            object = objectOrMaterial;
            material = object.material;
        }

        return { object, material };
    }
    static shade(objectOrMaterial, light, position, eye, normal, in_shadow) {
        let { object, material } = Phong.getObjectAndMaterial(objectOrMaterial);

        const materialColor =
            material.pattern === undefined
                ? material.color
                : object === undefined
                ? material.pattern.colorAt(position)
                : material.pattern.shapeColorAt(object, position);

        // combine the surface color with the light's color/intensity
        const effective_color = materialColor.multiply(light.intensity);

        // compute ambient contribution
        const ambient = effective_color.multiply(material.ambient, 1.0);

        if (in_shadow) {
            return ambient;
        }

        // find the direction to the light source
        const lightv = light.position.minus(position).normalize();

        // light_dir_normal represents the cosine of the angle between the
        // light vector and the normal vector. A negative number means the
        // light is on the other side of the surface
        const light_dot_normal = lightv.dot(normal);
        let diffuse;
        let specular;
        if (light_dot_normal < 0) {
            diffuse = new Color(0, 0, 0);
            specular = new Color(0, 0, 0);
        } else {
            // compute the diffuse contribution
            diffuse = effective_color.multiply(material.diffuse, 1.0).multiply(light_dot_normal, 1.0);
            const reflectv = lightv.negate().reflect(normal);
            const reflectv_dot_eye = reflectv.dot(eye);
            if (reflectv_dot_eye < 0) {
                specular = new Color(0, 0, 0);
            } else {
                const factor = Math.pow(reflectv_dot_eye, material.shininess);
                specular = light.intensity.multiply(material.specular, 1.0).multiply(factor, 1.0);
            }
        }

        return ambient.plus(diffuse, 1.0).plus(specular, 1.0);
    }

    static shadeHit(world, info, remaining) {
        const isShadowed = world.isShadowed(info.overPoint);
        const surfaceColor = Phong.shade(info.object, world.light, info.overPoint, info.eyev, info.normalv, isShadowed);

        if (remaining === undefined) {
            return surfaceColor;
        }

        // reflections
        const reflectedColor = world.reflectedColor(info, remaining);
        // refractions
        const refractedColor = world.refractedColor(info, remaining);

        let result;

        if (Phong.shouldSchlick(info)) {
            const reflectance = schlick(info);
            result = surfaceColor
                .plus(reflectedColor.multiply(reflectance), 1)
                .plus(refractedColor.multiply(1 - reflectance), 1);
        } else {
            result = surfaceColor.plus(reflectedColor, 1).plus(refractedColor, 1);
        }

        return result;
    }

    static shouldSchlick(info) {
        const { object, material } = this.getObjectAndMaterial(info.object);
        return material.reflective > 0 && material.transparency > 0;
    }
}

export function schlick(info) {
    let cos = info.eyev.dot(info.normalv);
    if (info.n1 > info.n2) {
        const n = info.n1 / info.n2;
        const sin2_t = n * n * (1.0 - cos * cos);
        if (sin2_t > 1.0) {
            return 1.0;
        }

        // compute cosine of theta_t using trig identity
        const cos_t = Math.sqrt(1.0 - sin2_t);
        cos = cos_t;
    }

    const n1n2_magic = (info.n1 - info.n2) / (info.n1 + info.n2);
    const r0 = n1n2_magic * n1n2_magic;
    return r0 + (1 - r0) * Math.pow(1 - cos, 5);

    return 0.0;
}
