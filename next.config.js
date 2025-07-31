module.exports = {
  async rewrites() {
    return [
      {
        source: '/multiplayer/:roomId*',
        destination: '/',
      },
      {
        source: '/play/:roomId*',
        destination: '/',
      }
    ];
  },
}