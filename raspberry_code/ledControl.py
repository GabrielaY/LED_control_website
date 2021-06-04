from dt.src.ditto.client import Client
from dt.src.ditto.protocol.topic import Topic
from dt.src.ditto.protocol.envelope import Envelope
from ledFill import led_fill, led_off, led_on, color_transition, full_gradient_list
import board
import neopixel
import multiprocessing
import time
import json
from datetime import datetime
from threading import Timer

modify_topic = Topic().from_string("led_raspberry/myRspbLed/things/twin/commands/modify")
pixels = neopixel.NeoPixel(board.D18, 54)
ditto_python_client = Client()
running = False
chase = None

def check_if_running():
    global running
    global chase
    if running == True:
      chase.terminate()
      running = False
      
def start_event(time, event):
    global pixels
    x = datetime.today()
    time = time.split(':')
    y = x.replace(hour=int(time[0]), minute=int(time[1]), second=0, microsecond=0)
    delta_t=y-x

    if event == "off":
      t = Timer(delta_t.seconds, led_off, [pixels])
      t.start()
    if event == "on":
      t = Timer(delta_t.seconds, led_on, [pixels, "#ffffff"])
      t.start()
    
def start_color_transition(colors):
    global running
    global chase
    chase = multiprocessing.Process(target = color_transition, args=[pixels, full_gradient_list(colors)])
    chase.start()
    running = True
    
def on_message(request_id, envelope):
    action = str(envelope.topic.action)
    value = envelope.value
    check_if_running()
    
    if action == "ledColor":
      led_fill(pixels, value)
      path = "/features/ledLights/properties/color"
      
    elif action == "off":
      led_off(pixels)
      path = "/features/ledLights/properties/status"
      
    elif action == "on":
      led_on(pixels, value)
      path = "/features/ledLights/properties/status"
      
    elif action == "event":
      info = json.loads(envelope.value)
      print(info["time"])
      start_event(info["time"], info["state"])
      return
      
    elif action == "colorTransition":
      start_color_transition(value.split(','))
      return
      
    response_envelope = Envelope().with_topic(modify_topic).with_path(path).with_value(value)
    ditto_python_client.send(response_envelope)
    
    

#def on_log(client, log_level, log_msg):
#   print(log_msg)
    
def client_on_connect(client):
    print("Conected")
    global ditto_python_client
    ditto_python_client.subscribe(on_message)

#ditto_python_client.enable_logger(True)
#ditto_python_client.on_log = on_log
ditto_python_client.on_connect = client_on_connect
ditto_python_client.connect("localhost", 1883, 60)



while True:
    continue




