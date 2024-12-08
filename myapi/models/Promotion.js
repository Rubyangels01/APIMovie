class Promotion {
    constructor({ namePromotion, startDate, endDate, percentSell, description, totalBill }) {
        this.namePromotion = namePromotion;
        this.startDate = startDate;
        this.endDate = endDate;
        this.percentSell = percentSell;
        this.description = description;
        this.totalBill = totalBill;
    }
}

module.exports = Promotion;