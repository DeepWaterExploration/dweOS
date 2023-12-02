def list_diff(listA, listB):
    # find the difference between lists
    diff = []
    for element in listA:
        if element not in listB:
            diff.append(element)
    return diff