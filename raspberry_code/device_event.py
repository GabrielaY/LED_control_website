import json

TOPIC = "topic"
PATH = "path"
VALUE = "value"

class DeviceEvent:
    
    def unmarshal_json(self, data: json):
        try:
            envelope_dict = json.loads(data)
        except json.JSONDecodeError as jex:
            return jex

        for k, v in envelope_dict.copy().items():
            if k == TOPIC:
                self.topic = v

            if k == PATH:
                self.path = v

            if k == VALUE:
                self.value = v

        print(self)
        return 0
        
    def get_value(self):
        return self.value.get(VALUE).get(VALUE)
