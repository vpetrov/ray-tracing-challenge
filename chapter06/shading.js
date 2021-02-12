import { Color } from './tuple';
import { eqf } from './math';

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
    constructor(color, ambient, diffuse, specular, shininess) {
        this.color = color === undefined ? new Color(1, 1, 1) : color;
        this.ambient = ambient === undefined ? 0.1 : ambient;
        this.diffuse = diffuse === undefined ? 0.9 : diffuse;
        this.specular = specular === undefined ? 0.9 : specular;
        this.shininess = shininess === undefined ? 200.0 : shininess;
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
}

export class Phong {
    static shade(material, light, position, eye, normal) {
        // combine the surface color with the light's color/intensity
        const effective_color = material.color.multiply(light.intensity);

        // find the direction to the light source
        const lightv = light.position.minus(position).normalize();

        // compute ambient contribution
        const ambient = effective_color.multiply(material.ambient);

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
            diffuse = effective_color.multiply(material.diffuse).multiply(light_dot_normal);
            const reflectv = lightv.negate().reflect(normal);
            const reflectv_dot_eye = reflectv.dot(eye);
            if (reflectv_dot_eye < 0) {
                specular = new Color(0, 0, 0);
            } else {
                const factor = Math.pow(reflectv_dot_eye, material.shininess);
                specular = light.intensity.multiply(material.specular).multiply(factor);
            }
        }

        return ambient.plus(diffuse).plus(specular);
        //return ambient;
        //return diffuse;
        //return specular;
    }
}
