describe('challenge "Password Hash Leak"', () => {
  beforeEach(() => {
    cy.login({ email: 'admin@juice-sh.op', password: 'admin123' })
  })

  it('does not expose sensitive fields through the profile projection', () => {
    cy.request({
      method: 'GET',
      url: '/rest/user/whoami?fields=id,email,password,totpSecret,dataValues',
      headers: {
        // Cypress automatically handles cookies after cy.login
      }
    }).then((res) => {
      expect(res.body.user.id).to.be.a('number')
      expect(res.body.user.email).to.be.a('string')
      expect(res.body.user.password).to.be.undefined
      expect(res.body.user.totpSecret).to.be.undefined
      expect(res.body.user.dataValues).to.be.undefined
    })
  })
})
