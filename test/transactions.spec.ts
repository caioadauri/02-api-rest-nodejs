import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionResonse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies?.join('; ') ?? '')
      .expect(200)

    expect(listTransactionResonse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transaction',
        amount: 5000,
      }),
    ])
  })

  it('should be able to get spefic transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResonse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies?.join('; ') ?? '')
      .expect(200)

    const transactionId = listTransactionsResonse.body.transactions[0].id

    const getTransactionsResonse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies?.join('; ') ?? '')
      .expect(200)

    console.log(getTransactionsResonse.body)

    expect(getTransactionsResonse.body.transactions).toEqual(
      expect.objectContaining({
        title: 'New Transaction',
        amount: 5000,
      }),
    )
  })

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies?.join('; ') ?? '')
      .send({
        title: 'Debit Transaction',
        amount: 2000,
        type: 'debit',
      })

    const summaryResonse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies?.join('; ') ?? '')
      .expect(200)

    expect(summaryResonse.body).toEqual({
      amount: 3000,
    })
  })
})
