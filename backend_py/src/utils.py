def fourcc2s(fourcc: int):
    res = ''
    res += chr(fourcc & 0x7f)
    res += chr((fourcc >> 8) & 0x7f)
    res += chr((fourcc >> 16) & 0x7f)
    res += chr((fourcc >> 24) & 0x7f)
    if fourcc & (1 << 31):
        res += '-BE'
    return res


def list_diff(listA, listB):
    # find the difference between lists
    diff = []
    for element in listA:
        if element not in listB:
            diff.append(element)
    return diff
