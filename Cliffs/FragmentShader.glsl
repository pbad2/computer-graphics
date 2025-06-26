#version 300 es
precision highp float;

in vec4 vColor;
in vec3 vnormal;

uniform vec3 lightdir;
uniform vec3 lightcolor;

uniform vec3 camera_position;
uniform mat4 mv;
uniform mat4 p;

uniform vec4 color;

out vec4 fragColor;


void main() {
    vec3 n = normalize(vnormal); 
    vec3 h = normalize(lightdir + camera_position);
    float lambert = max(dot(-n, lightdir), 0.0);
    float blinn = max(pow(dot(h, -n), 30.0), 0.0);

    vec3 shallowColor = vec3(0.2, 0.6, 0.1);
    vec3 steepColor = vec3(0.6, 0.3, 0.3);

    // float steepness = dot(-n, vec3(0.0, 0.0, 1.0));

    float steepness = -n.z;

    vec3 chosenColor = steepness > 0.8 ? shallowColor : steepColor;

    float shallowBlinn = pow(max(dot(h, -n), 0.0), 60.0);
    float steepBlinn = pow(max(dot(h, -n), 0.0), 30.0);
    
    float chosenShine = steepness > 0.8 ? shallowBlinn : steepBlinn;

    fragColor = vec4(chosenColor.rgb * (lightcolor * lambert) + chosenShine, color.a);
}
