from PIL import Image
import sys
import numpy as np
import math
from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z", "w"])
Color = namedtuple("Color", ["r", "g", "b", "a"])
Vertex = namedtuple("Vertex", ["x", "y", "z", "w", "r", "g", "b", "a"])
dtype = [("x", float), ("y", float), ("z", float), ("w", float), ("r", float), ("g", float), ("b", float), ("a", float)]


def get_position(words: list[str], width: int, height: int):
    xy_coordinate_pairs = []
    # position size num0 num1 num2 …
    ndimensions = int(words[1])
    positions = words[2::]
    #print(positions)
    if (len(positions) % ndimensions) != 0:
        print("Invalid number of positions!")
        exit()

    x_coordinates = positions[::ndimensions]
    y_coordinates = positions[1::ndimensions]
    z_coordinates = positions[2::ndimensions]
    w_coordinates = positions[3::ndimensions]
    # viewport and division by double moves (x,y,z,w) to ((x/w+1)*width/2, (y/w+1)*height/2)
    for i in range(int(len(positions)/ndimensions)):
        #print(i)
        x_coord = float(x_coordinates[i])
        y_coord = float(y_coordinates[i])
        z_coord = float(z_coordinates[i])
        w_coord = float(w_coordinates[i])
        x = (x_coord/w_coord+1)*width/2
        y = (y_coord/w_coord+1)*height/2
        #z = z_coord/w_coord
        z = z_coord
        w = w_coord
        point = Point(x, y, z, w)
        xy_coordinate_pairs.append(point)
    #print(xy_coordinate_pairs)

    return xy_coordinate_pairs

######################################################################################################

def get_colors(words: list[str]):
    color_buffer = []
    colors_dimension = int(words[1])
    colors = words[2::]

    if (len(colors) % colors_dimension) != 0:
        print("Invalid number of positions!")
        exit()

    red = colors[::colors_dimension]
    green = colors[1::colors_dimension]
    blue = colors[2::colors_dimension]
    if (colors_dimension == 4):
        alpha = colors[3::colors_dimension]
    else:
        alpha = [0 for i in range(int(len(colors)/colors_dimension))]    
    for i in range (int(len(colors)/colors_dimension)):
        r = float(red[i])
        g = float(green[i])
        b = float(blue[i])
        a = float(alpha[i])
        color = Color(r, g, b, a)
        color_buffer.append(color)
    return color_buffer 

######################################################################################################

def get_elements(words: list[str]):
    elements = words[1::]
    elements_buffer = []
    for i in range(int(len(elements))):
        elements_buffer.append(int(elements[i]))

    return elements_buffer   

######################################################################################################

def get_points(a, b, int_dimension):
    interpolated_points = []
    if a[int_dimension] == b[int_dimension]:
        return interpolated_points
    elif a[int_dimension] > b[int_dimension]:
        a, b = b, a

    s = (b - a)/(b[int_dimension] - a[int_dimension])
    e = math.ceil(a[int_dimension]) - a[int_dimension]


    o = e * s
    p = a + o 
    while p[int_dimension] < b[int_dimension] :
        interpolated_points.append(p.tolist())
        p += s
        
    return interpolated_points  

######################################################################################################

def drawArraysTriangles(v0: Point, v1: Point, v2: Point, c0: Color, c1: Color, c2: Color, img: Image, sRGB: bool, depth: bool, z_array, hyp: bool, alpha: bool):
    #Interpolate point and create edges on the image
    if hyp == True: 
        vt0 = Vertex(v0.x, v0.y, v0.z/v0.w, 1/v0.w, c0.r/v0.w, c0.g/v0.w, c0.b/v0.w, c0.a)
        vt1 = Vertex(v1.x, v1.y, v1.z/v1.w, 1/v1.w, c1.r/v1.w, c1.g/v1.w, c1.b/v1.w, c1.a)
        vt2 = Vertex(v2.x, v2.y, v2.z/v2.w, 1/v2.w, c2.r/v2.w, c2.g/v2.w, c2.b/v2.w, c2.a)
    else:
        vt0 = Vertex(v0.x, v0.y, v0.z, 1/v0.w, c0.r, c0.g, c0.b, c0.a)
        vt1 = Vertex(v1.x, v1.y, v1.z, 1/v1.w, c1.r, c1.g, c1.b, c1.a)
        vt2 = Vertex(v2.x, v2.y, v2.z, 1/v2.w, c2.r, c2.g, c2.b, c2.a)
    #create list, put the list into an np.array so each of the elements in the list is a vector since DDA algorithm works on vectors
    vertex_li = [vt0, vt1, vt2]
    vertex_arr  = np.array(vertex_li, dtype=dtype)
    #Sort the vector array by y
    s_vertex_arr = np.sort(vertex_arr, order="y")
    #print(s_vertex_arr)
    #create top, middle and bottom vector from the the array
    top_vec = np.array([s_vertex_arr[0][0], s_vertex_arr[0][1], s_vertex_arr[0][2], s_vertex_arr[0][3], 
                        s_vertex_arr[0][4], s_vertex_arr[0][5], s_vertex_arr[0][6], s_vertex_arr[0][7]])
    mid_vec = np.array([s_vertex_arr[1][0], s_vertex_arr[1][1], s_vertex_arr[1][2], s_vertex_arr[1][3], 
                        s_vertex_arr[1][4], s_vertex_arr[1][5], s_vertex_arr[1][6], s_vertex_arr[1][7]])
    bottom_vec = np.array([s_vertex_arr[2][0], s_vertex_arr[2][1], s_vertex_arr[2][2], s_vertex_arr[2][3], 
                           s_vertex_arr[2][4], s_vertex_arr[2][5], s_vertex_arr[2][6], s_vertex_arr[2][7]])
    #create longest edge from top to bottom vertex -> get points  
    tb = get_points(top_vec, bottom_vec, 1)
    if hyp == True:
        for p in tb:
            p[4] = p[4]/p[3]
            p[5] = p[5]/p[3]
            p[6] = p[6]/p[3]
            p[3] = 1/p[3]
    #create edge from top to middle vertex-> get points 
    tm = get_points(top_vec, mid_vec, 1)
    if hyp == True:
        for p in tm:
            p[4] = p[4]/p[3]
            p[5] = p[5]/p[3]
            p[6] = p[6]/p[3]
            p[3] = 1/p[3]
    #create edge from middle to bottom vertex-> get points 
    mb = get_points(mid_vec, bottom_vec, 1)
    if hyp == True:
        for p in mb:
            p[4] = p[4]/p[3]
            p[5] = p[5]/p[3]
            p[6] = p[6]/p[3]
            p[3] = 1/p[3]   
    fillTriangles(tb, tm, mb, img, sRGB, depth, z_array, hyp, alpha)    
    

######################################################################################################    

def fillTriangles(t_edge: list(dtype), m_edge: list(dtype), b_edge: list(dtype), img: Image, sRGB: bool, depth: bool, z_array, hyp: bool, alpha: bool):
    edge_list = t_edge + m_edge + b_edge
    edge_list.sort(key=lambda e_pt: (e_pt[1], e_pt[0]))

    if (len(edge_list) > 0):
        min_y = int(round(min(e_pt[1] for e_pt in edge_list)))
        max_y = int(round(max(e_pt[1] for e_pt in edge_list)))

        pixels = img.load()
        for y in range(min_y, max_y + 1):
            y_x_list = [edge for edge in edge_list if int(edge[1]) == y]
            i = 0
            while(i < len(y_x_list) - 1):
                v0 = np.array(y_x_list[i])
                v1 = np.array(y_x_list[i+1])
                if hyp == True:
                    w = v0[3]
                    v0[2] = v0[2]/w
                    v0[3] = 1/w
                    v0[4] = v0[4]/w
                    v0[5] = v0[5]/w
                    v0[6] = v0[6]/w
                    w = v1[3]
                    v1[2] = v1[2]/w
                    v1[3] = 1/w
                    v1[4] = v1[4]/w
                    v1[5] = v1[5]/w
                    v1[6] = v1[6]/w
                    v1[3] = 1/w
                points = get_points(v0, v1, 0)
                if hyp == True:
                    for p in points:
                        p[4] = p[4]/p[3]
                        p[5] = p[5]/p[3]
                        p[6] = p[6]/p[3]
                        p[3] = 1/p[3]
                if (len(points)):
                    for p in points:
                        x = int(round(p[0]))
                        y = int(round(p[1]))
                        z = p[2]
                        if (x < img.width and y < img.height):
                            if depth == True :
                                if z < z_array[x][y]:
                                    z_array[x][y]  = z
                                    if sRGB == True:
                                        r = int(round((linear_to_srgb(p[4])*255))) 
                                        g = int(round((linear_to_srgb(p[5])*255))) 
                                        b = int(round((linear_to_srgb(p[6])*255)))
                                        a = int(round(p[7] * 255)) 
                                        if alpha == True:
                                            pixels[x, y]  = (r,g,b,a)
                                        else:
                                            pixels[x, y] = (r,g,b)   
                                    else:
                                        if alpha == True:
                                            a = int(round(p[7] * 255)) 
                                            pixels[x, y]  = (int(round(p[4] * 255)), int(round(p[5] * 255)), int(round(p[6] * 255)), a)
                                        else:
                                            pixels[x, y]  = (int(round(p[4] * 255)), int(round(p[5] * 255)), int(round(p[6] * 255)))   
                            else:
                                if sRGB == True:
                                    r = int(round((linear_to_srgb(p[4])*255))) 
                                    g = int(round((linear_to_srgb(p[5])*255))) 
                                    b = int(round((linear_to_srgb(p[6])*255)))
                                    a = int(round(p[7] * 255)) 
                                    if alpha == True:
                                        pixels[x, y]  = (r,g,b,a)
                                    else:
                                        pixels[x, y] = (r,g,b)   
                                else:
                                    if alpha == True:
                                        a = int(round(p[7] * 255)) 
                                        pixels[x, y]  = (int(round(p[4] * 255)), int(round(p[5] * 255)), int(round(p[6] * 255)), a)
                                    else:
                                        pixels[x, y]  = (int(round(p[4] * 255)), int(round(p[5] * 255)), int(round(p[6] * 255)))   
                i += 1

 ######################################################################################################

def linear_to_srgb(value): #OH
    if value <= 0.0031308:
        return 12.92 * value
    else:
        return 1.055 * (value**(1/2.4)) - 0.055
    
 ######################################################################################################

def createImage(argv):
    

    input_filename = sys.argv[1]
    positions = []
    colors = []
    sRGB = False 
    depth = False
    hyp = False
    alpha = False
    max_int = np.iinfo(np.int32).max
    try:
        with open(input_filename, 'r') as my_file:
            lines = my_file.readlines()
    except FileNotFoundError:
        print("Input file cannot be opened!")
        exit()

    # array of keywords
    keywords = ["png", "position", "color", "drawArraysTriangles", "sRGB", "depth", "hyp", "elements", "drawElementsTriangles"]
    for line in lines:
        if len(line) == 0:
            continue
        words = line.split()
        if len(words) == 0:
            continue
        if words[0] not in keywords:
            continue
        # png width height filename
        elif words[0] == "png":
            if len(words) < 4:
                print("png does not have enough attributes")
                exit()
            if not (words[1].isdigit()) or not words[2].isdigit():
                print("Width and height have to be integers!")
                exit()
            width = int(words[1])
            height = int(words[2])
            out_filename = words[3]
            # Creates a blank image with the following attributes
            # might be a setting I need to toggle for where origin is in the image
            img = Image.new(mode = "RGBA", size = (int(width), int(height)), color=(255, 255, 255, 1)) # gray background
            z_array = np.full((img.width, img.height), float("inf"))
        elif words[0] == "sRGB":
            sRGB = True
        elif words[0] == "depth":
            depth = True 
        elif words[0] == "hyp":
            hyp = True              
        # position size num0 num1 num2 …
        elif words[0] == "position":
            positions = get_position(words, width, height)
        # color size num0 num1 num2 …
        #positions[i] = colors[i]
        elif words[0] == "color":
            if words[1] == 4:
                alpha = True
                #img.convert("RGBA")
            colors = get_colors(words)
        elif words[0] == "elements":
            elements = get_elements(words)    
        # drawArraysTriangles first count
        elif words[0] == "drawArraysTriangles":
            first = int(words[1])
            count = int(words[2])
            for i in range (first, count, 3):
               drawArraysTriangles(positions[i], positions[i+1], positions[i+2], colors[i], colors[i+1], colors[i+2], img, sRGB, depth, z_array, hyp, alpha)
        elif words[0] == "drawElementsTriangles":
            count = int(words[1])
            offset = int(words[2])
            start = offset
            end = offset + count - 1
            for i in range (start, end, 3):
               drawArraysTriangles(positions[elements[i]], positions[elements[i+1]], positions[elements[i+2]], colors[elements[i]], 
                                   colors[elements[i+1]], colors[elements[i+2]], img, sRGB, depth, z_array, hyp, alpha)
    # img.show()
    img.save(out_filename)

######################################################################################################

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Input file needs to be specified")
        exit()
    createImage(sys.argv)