from datetime import datetime

def moment_spliter(moment: datetime) -> dict:
    return {
        "date": moment.strftime("%d-%b-%Y"),
        "time": moment.strftime("%I:%M %p")
    }

def user_entity(item) -> dict:
    return {
        "id": item.id,
        "username": item.username,
        "name": item.name,
        "shop_name": item.shop_name,
        "mobile_no": item.mobile_no,
        "email": item.email,
        "created_at": moment_spliter(item.created_at)
    }

def user_entitys(items) -> list:
    return [user_entity(item) for item in items]
