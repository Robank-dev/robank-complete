export class ProviderAdapter {
  constructor({ id, name, category, network = null, status = 'provider-dependent', capabilities = [] }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.network = network;
    this.status = status;
    this.capabilities = capabilities;
  }

  isAvailable() {
    return this.status === 'live' || this.status === 'beta';
  }

  supports(capability) {
    return this.capabilities.includes(capability);
  }

  async execute() {
    throw new Error(`${this.name} execution is not configured`);
  }
}