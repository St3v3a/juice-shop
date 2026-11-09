describe('/b2b/v2/orders', () => {
  beforeEach(() => {
    cy.login({ email: 'admin', password: 'admin123' })
  })

  for (const [name, orderLinesData] of [
    ['infinite-loop text', '(function dos() { while(true); })()'],
    ['costly-regex text', "/((a+)+)b/.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaa')"],
    ['sandbox-breakout text', 'this.constructor.constructor("return process")().exit()']
  ] as const) {
    it(`treats ${name} as inert order data`, () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token')
        expect(token).not.to.equal(null)
        cy.request({
          method: 'POST',
          url: '/b2b/v2/orders/',
          headers: { Authorization: `Bearer ${token}` },
          body: { cid: 'test-customer', orderLinesData }
        }).then((response) => {
          expect(response.status).to.equal(200)
          expect(response.body.cid).to.equal('test-customer')
          expect(response.body.orderNo).to.be.a('string')
          expect(response.body.paymentDue).to.be.a('string')
        })
      })
    })
  }
})
