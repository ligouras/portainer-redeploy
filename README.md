# Portainer redeploy action

This action stops, updates & starts an running Portainer stack.

## Inputs

- `portainer-host`

    **Required**: Portainer host URL.

- `access-token`

    **Required**: Token used for authentication to Portainer host.

- `endpoint-id`

    Endpoint ID where the stack is running. If not provided, the first endpoint will be used.

- `stack-name`

    **Required**: Name for the Portainer stack.

- `stack-env`

    List of stack environment variables that will be added/updated.

## Example usage

```yaml
uses: ligouras/portainer-redeploy-action@main
with:
  portainer-host: https://portainer.example.com
  access-token: ${{ secrets.PORTAINER_TOKEN }}
  endpoint-id: 1
  stack-name: my-awesome-web-app
  stack-env: |
    NODE_ENV=production
    PORT=3000
```
