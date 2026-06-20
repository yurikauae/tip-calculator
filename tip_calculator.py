def calculate_tip(bill_total, tip_percent, num_people=1):
    tip_amount = bill_total * (tip_percent / 100)
    total = bill_total + tip_amount
    per_person = total / num_people
    return tip_amount, total, per_person


def main():
    bill = float(input("Enter bill total: $"))
    tip = float(input("Enter tip percentage: "))
    people = int(input("Number of people splitting the bill: "))

    tip_amount, total, per_person = calculate_tip(bill, tip, people)

    print(f"\nTip amount:      ${tip_amount:.2f}")
    print(f"Total bill:      ${total:.2f}")
    print(f"Per person:      ${per_person:.2f}")


if __name__ == "__main__":
    main()
