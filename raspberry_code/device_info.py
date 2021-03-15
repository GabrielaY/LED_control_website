from model.namespaced_id import NamespacedID
import json

DEVICE_ID_KEY = "deviceId"
TENANT_ID_KEY = "tenantId"
POLICY_ID_KEY = "policyId"

ALLOWED_KEYS = [DEVICE_ID_KEY, TENANT_ID_KEY, POLICY_ID_KEY]


class DeviceInfo:
    def __init__(self, **kwargs):
        self.deviceId = None
        self.tenantId = None
        self.policyId = None

        for k, v in kwargs.items():
            print(k)
            if k in ALLOWED_KEYS:
                self.__setattr__(k, v)

    def unmarshal_json(self, data: json):
        try:
            envelope_dict = json.loads(data)
        except json.JSONDecodeError as jex:
            return jex

        for k, v in envelope_dict.copy().items():
            if k == DEVICE_ID_KEY:
                self.deviceId = NamespacedID(v)

            if k == POLICY_ID_KEY:
                self.policyId = NamespacedID(v)

            if k == TENANT_ID_KEY:
                self.tenantId = v

        print(self)
        return 0
