

phone_directory = {}

try:
    n = int(input("Enter number of contacts: "))

    for i in range(n):
        print("\nEnter details for contact", i + 1)

        name = input("Enter Name: ")
        phone = input("Enter Phone Number: ")
        place = input("Enter Place: ")

        if not phone.isdigit() or len(phone) != 10:
            raise ValueError("Phone number must be exactly 10 digits.")

        phone_directory[name] = {
            "Phone Number": phone,
            "Place": place
        }

except ValueError as ve:
    print("Error:", ve)

else:
    print("\nPhone Directory Details:")
    for name, details in phone_directory.items():
        print("\nName:", name)
        print("Phone Number:", details["Phone Number"])
        print("Place:", details["Place"])

finally:
    print(phone_directory)