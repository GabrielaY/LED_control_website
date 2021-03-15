import neopixel
import time

def led_fill(pixels, color): 
  rgb_color = hex_to_rgb(color)
  pixels.fill((rgb_color[0], rgb_color[1], rgb_color[2]))
  return color
  
def led_off(pixels):
  pixels.fill((0,0,0))
  return "off"
  
def led_on(pixels, color):  
  led_fill(pixels,color);
  return "on"
    
def hex_to_rgb(hex_color):
  hex_color = hex_color.lstrip('#')
  rgb_color = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
  return rgb_color

def linear_gradient(start_hex, finish_hex, n=30):
  s = hex_to_rgb(start_hex)
  f = hex_to_rgb(finish_hex)
  RGB_list = [s]
  
  for t in range(1, n):
    curr_vector = [
      int(s[j] + (float(t)/(n-1))*(f[j]-s[j]))
      for j in range(3)
    ]

    RGB_list.append(tuple(curr_vector))

  return RGB_list

def full_gradient_list(colors):
  gradient_list = []
  for i in range (len(colors)):
    if i != (len(colors)-1):
      for j in linear_gradient(colors[i], colors[i+1]):
        gradient_list.append(j)
    
  return gradient_list

def color_transition(pixels, color_list):
  while True:
    for color in color_list:
      pixels.fill(color)
      time.sleep(0.3)
    for color in reversed(color_list):
      pixels.fill(color)
      time.sleep(0.3)
  
