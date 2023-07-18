import { Call } from '@core/types/phone';
import { Log, CallInfo, GlobalEventNames } from '@core/types/events';

type Events = GlobalEventNames | 'widgetReady';

const log = (...args: any[]) => console.log('widget-server', ...args);

(function () {
  window.Brekeke.renderWidget(
    document.getElementById('widget_embed_div')!,
    ({
       fireCallInfoEvent,
       fireConfigEvent,
       fireLogSavedEvent,
       fireMakeCallEvent,
       onCallUpdatedEvent,
       onCallEndedEvent,
       onLoggedOutEvent,
       onLoggedInEvent,
       onCallEvent,
       onLogEvent,
     }) => {
      const app = window.parent;

      const calls: Record<string, Call> = {};

      const messageName = (name: Events) => `brekeke:${name}`;

      const sendMessage = <T>(name: Events, data?: T) => {
        try {
          app.postMessage(JSON.stringify({ name: messageName(name), data }), '*');
        } catch (e) {
          log('send message error', name, e);
        }
      };

      window.addEventListener('message', event => {
        try {
          const { name, data } = JSON.parse(event.data);
          if (!name || (typeof name == 'string' && !name.startsWith('brekeke:'))) return;

          log(`${name} message received`, event);
          log(`${name} message data`, data);

          switch (name) {
            case messageName('make-call'):
              fireMakeCallEvent(data);
              break;
            case messageName('call-info'):
              const call = data.call as Call;
              fireCallInfoEvent(call, data.info);
              break;
            case messageName('config'):
              fireConfigEvent(data);
              break;
            case messageName('log-saved'):
              const log = data as Log;
              fireLogSavedEvent(log);
              delete calls[log.call.pbxRoomId];
              break;
          }
        } catch (e) {
          log('message error, invalid json string', e);
        }
      });

      sendMessage('widgetReady');

      onLoggedInEvent(account => {
        sendMessage('logged-in', account);
      });

      onLoggedOutEvent(() => {
        sendMessage('logged-out');
      });

      onCallEvent(call => {
        calls[call.pbxRoomId] = call;
        sendMessage('call', simplifyCall(call));
      });

      onCallUpdatedEvent(call => {
        calls[call.pbxRoomId] = call;
        sendMessage('call-updated', simplifyCall(call));
      });

      onCallEndedEvent(call => {
        calls[call.pbxRoomId] = call;
        sendMessage('call-ended', simplifyCall(call));
      });

      onLogEvent(log => {
        sendMessage('log', { ...log, call: simplifyCall(log.call) });
      });
    });
})();

const validTypes = ['string', 'number', 'boolean'];
const simplifyCall = (call: Call) => {
  return Object.keys(call).reduce((acc, key) => {
    const property: unknown = call[key as keyof Call];

    if (validTypes.includes(typeof property)) {
      // @ts-ignore
      acc[key] = property;
    }

    return acc;
  }, {} as Call);
}

const formatRecordName = (name: string, type: string) => `[${type}] ${name}`;

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};
