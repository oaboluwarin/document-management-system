import { expect } from 'chai';
import app from '../../app';
import model from '../../models';
import resourceCreator from '../resourceCreator';


const request = require('supertest')(app);

const adminUser = resourceCreator.createAdmin();
const regularUser = resourceCreator.createUser();
const firstRole = resourceCreator.createAdminRole();
const secondRole = resourceCreator.createRegularRole();

describe('User Authorization', () => {
  let adminToken, adminRole, regularRole, regularToken;
  before((done) => {
    model.Role.bulkCreate([firstRole, secondRole], {
      returning: true
    })
      .then((createdRoles) => {
        adminRole = createdRoles[0];
        regularRole = createdRoles[1];
        adminUser.roleId = adminRole.id;
        regularUser.roleId = regularRole.id;

        request.post('/user')
          .send(adminUser)
          .end((error, response) => {
            adminToken = response.body.token;
            request.post('/user')
              .send(regularUser)
              .end((err, res) => {
                regularToken = res.body.token;
                done();
              });
          });
      });
  });

  after(() => model.sequelize.sync({ force: true }));

  it('should not authorize a user who does not have a token set', (done) => {
    request.get('/user')
      .end((error, response) => {
        expect(response.status).to.equal(401);
        done();
      });
  });

  it('should not authorize a user that has an invalid token', (done) => {
    request.get('/user')
      .set({ Authorization: 'trinity' })
      .end((error, response) => {
        expect(response.status).to.equal(401);
        done();
      });
  });

  it(`should not return all users if the user requesting for them is
  not an admin user`, (done) => {
    request.get('/user')
      .set({ Authorization: regularToken })
      .expect(403, done);
  });

  it(`should correctly return all users when required valid token
  and access levels are set`,
    (done) => {
      request.get('/user')
        .set({ Authorization: adminToken })
        .end((error, response) => {
          expect(response.status).to.equal(200);
          // eslint-disable-next-line no-unused-expressions
          expect(Array.isArray(response.body.usersFound)).to.be.true;
          expect(response.body.usersFound.length).to.be.greaterThan(0);
          expect(response.body.usersFound[0].userName)
            .to.equal(adminUser.userName);
          done();
        });
    });
});
