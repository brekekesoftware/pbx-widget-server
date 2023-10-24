# Widget Server

Widget Server provider for PBX Widget integration on Zendesk and Freshdesk.

## Usage

- Run the command `npm install` to install all the dependencies, then run `npm run build` to build the project.
- After building, copy the contents of the `dist` folder to a server directory in your PBX webapps directory. EG `C:\Program Files\Brekeke\pbx\webapps\pbx\etc\widget\server`
- The Widget can now be accessed at `[PBX_URL]/pbx/etc/widget/server/index.html` EG `https://brekeke.com:8443/pbx/etc/widget/server/index.html`
