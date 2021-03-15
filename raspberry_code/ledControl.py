import json
import multiprocessing
import time

import board
import neopixel
import paho.mqtt.client as mqtt
from device_event import DeviceEvent
from device_info import DeviceInfo
from protocol.envelope import Envelope
from protocol.topic import Topic, TopicGroup, TopicChannel, TopicCriterion, TopicAction
from ledFill import led_fill, led_off, led_on, color_transition, full_gradient_list

EDGE_CLOUD_CONNECTOR_TOPIC_DEV_INFO = "edge/thing/response"

def client_on_connect(self, userdata, flags, rc):
    print("Connected")
    
    client.subscribe(EDGE_CLOUD_CONNECTOR_TOPIC_DEV_INFO)
    client.subscribe("command///req//#")

def client_on_message(self, userdata, msg):
    global running
    global chase
    print(msg.payload)
    #if msg.topic == EDGE_CLOUD_CONNECTOR_TOPIC_DEV_INFO:
     #   devInfo = DeviceInfo()
      #  devInfo.unmarshal_json(msg.payload)
       # return
    
    if msg.topic == "command///req//colorTransition":
        if running == True:
            chase.terminate()
            running = False
        event = DeviceEvent()
        event.unmarshal_json(msg.payload)
        chase = multiprocessing.Process(target = color_transition, args=[pixels, full_gradient_list(event.value.split(','))])
        chase.start()
        running = True
            
    elif msg.topic == "command///req//off":
        if running == True:
            chase.terminate()
            running = False
        response_envelope = Envelope().with_topic(t).with_path("/features/ledLights/properties/status").with_value(led_off(pixels))
        client.publish("e/t0081db5c97654ffa8a54a3a71021dc67_hub/led_raspberry:myRspbLed", response_envelope.marshal_json(), qos=1)
                
    elif msg.topic == "command///req//on":
        event = DeviceEvent()
        event.unmarshal_json(msg.payload)
        response_envelope = Envelope().with_topic(t).with_path("/features/ledLights/properties/status").with_value(led_on(pixels, event.value))
        client.publish("e/t0081db5c97654ffa8a54a3a71021dc67_hub/led_raspberry:myRspbLed", response_envelope.marshal_json(), qos=1)
        
    elif msg.topic == "command///req//ledColor":
        if running == True:
            chase.terminate()
            running = False
        event = DeviceEvent()
        event.unmarshal_json(msg.payload)
        response_envelope = Envelope().with_topic(t).with_path("/features/ledLights/properties/color").with_value(led_fill(pixels, event.value))
        client.publish("e/t0081db5c97654ffa8a54a3a71021dc67_hub/led_raspberry:myRspbLed", response_envelope.marshal_json(), qos=1)  
    


pixels = neopixel.NeoPixel(board.D18, 54)
client = mqtt.Client("myRaspberry", None, None, mqtt.MQTTv311)
client.on_connect = client_on_connect
client.on_message = client_on_message

running = False
chase = None
client.connect("192.168.91.249", 1883, 60)
t = Topic(
    namespace="led_raspberry",
    entity_id="myRspbLed",
    group=TopicGroup.GroupThings,
    channel=TopicChannel.ChannelTwin,
    criterion=TopicCriterion.CriterionCommands,
    action=TopicAction.ActionModify
)

client.loop_forever()
