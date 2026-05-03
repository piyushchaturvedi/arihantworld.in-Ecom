const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit','debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  reference: String,
  balanceAfter: { type: Number, required: true },
  createdBy: { type: String, default: 'system' },
  expiresAt: Date,    // when this credited amount expires (optional)
  expired: { type: Boolean, default: false },
}, { timestamps: true })

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  transactions: [transactionSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

walletSchema.methods.credit = async function(amount, description, reference='', createdBy='system', expiresInDays=null) {
  this.balance += amount
  const tx = { type:'credit', amount, description, reference, balanceAfter:this.balance, createdBy }
  if (expiresInDays) {
    const exp = new Date()
    exp.setDate(exp.getDate() + expiresInDays)
    tx.expiresAt = exp
  }
  this.transactions.push(tx)
  return this.save()
}

walletSchema.methods.debit = async function(amount, description, reference='', createdBy='system') {
  if (this.balance < amount) throw new Error('Insufficient wallet balance')
  this.balance -= amount
  this.transactions.push({ type:'debit', amount, description, reference, balanceAfter:this.balance, createdBy })
  return this.save()
}

// Call this periodically (or on each wallet fetch) to expire timed credits
walletSchema.methods.processExpiry = async function() {
  const now = new Date()
  let expired = false
  for (const tx of this.transactions) {
    if (tx.type === 'credit' && !tx.expired && tx.expiresAt && tx.expiresAt <= now) {
      const refundable = Math.min(tx.amount, this.balance)
      if (refundable > 0) {
        this.balance -= refundable
        this.transactions.push({
          type: 'debit', amount: refundable,
          description: `Expired: ${tx.description}`,
          reference: tx._id.toString(), balanceAfter: this.balance, createdBy: 'system',
        })
      }
      tx.expired = true
      expired = true
    }
  }
  if (expired) await this.save()
  return this
}

module.exports = mongoose.model('Wallet', walletSchema)
